'use strict';

const nodemailer = require('nodemailer');
const Email = require('email-templates');
const fs = require('fs');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);

const FORMS_DIRECTORY = './forms';

let Logger;
let smtpClient = null;
let emailer = null;
let forms = [];
let formsByFileName = {};
let previousFormSelection = '';

const formDefaults = {
  input: {
    required: false,
    placeholder: '',
    description: '',
    default: ''
  },
  select: {
    required: false
  },
  textarea: {
    required: false,
    placeholder: '',
    description: '',
    default: '',
    rows: 10
  }
};

const formRequiredFields = {
  input: ['label'],
  select: ['label'],
  textarea: ['label'],
  block: ['text'],
  links: ['links']
};

function startup(logger) {
  Logger = logger;
}

function maybeInitSmtp(options) {
  if (
    (options.deliveryMethod.value === 'email' || options.deliveryMethod.value === 'emailAndLog') &&
    smtpClient === null
  ) {
    Logger.info('Initializing SMTP Client');
    setupSmtpClient(options);
  }
}

function maybeSetupTemplateBuilder() {
  if (emailer === null) {
    Logger.info('Initializing Template Builder');
    setupTemplateBuilder();
  }
}

function doLookup(entities, options, cb) {
  Logger.trace({ entities, options }, 'doLookup');

  maybeInitSmtp(options);
  maybeSetupTemplateBuilder();

  try {
    maybeLoadForms(options);
  } catch (loadError) {
    let jsonError = parseErrorToReadableJSON(loadError);
    Logger.error({ jsonError }, 'Error loading interface');
    return cb(jsonError);
  }

  let lookupResults = [];

  entities.forEach((entityObj) => {
    if (!options.privateIpOnly || (options.privateIpOnly && entityObj.isIP && entityObj.isPrivateIP)) {
      lookupResults.push({
        entity: entityObj,
        isVolatile: true,
        data: {
          summary: [options.summaryTag],
          details: {
            target: entityObj.value,
            forms
          }
        }
      });
    }
  });

  Logger.trace({ lookupResults }, 'Lookup Results from doLookup');

  cb(null, lookupResults);
}

function setupSmtpClient(options) {
  const smtpOptions = {
    host: options.smtpHost,
    port: options.smtpPort
  };

  if (options.smtpUser && options.smtpPassword) {
    smtpOptions.auth = {
      type: 'login',
      user: options.smtpUser,
      pass: options.smtpPassword
    };
  }

  if (options.smtpConnectionSecurity.value === 'tls') {
    // Forces TLS when initially connecting.
    smtpOptions.secure = true;
  }

  if (options.smtpConnectionSecurity.value === 'none') {
    // Uses STARTTLS if available
    smtpOptions.secure = false;
  }

  if (options.smtpConnectionSecurity.value === 'starttls') {
    // Forces usage of STARTTLS even if the server does not advertise support for it.
    // Messages will not be sent in clear text
    smtpOptions.secure = false;
    smtpOptions.requireTLS = true;
  }

  Logger.trace({ smtpOptions }, 'SMTP Options');

  smtpClient = nodemailer.createTransport(smtpOptions);
}

function setupTemplateBuilder() {
  emailer = new Email({
    views: {
      root: './email-templates',
      options: {
        extension: 'hbs'
      }
    }
  });
}

function getRecipient(fileName, recipient, options) {
  if (recipient) {
    return recipient;
  } else if (formsByFileName[fileName] && formsByFileName[fileName].recipient) {
    return formsByFileName[fileName].recipient;
  } else {
    return options.recipient;
  }
}

function getEmailSubject(fileName) {
  if (formsByFileName[fileName] && formsByFileName[fileName].subject) {
    Logger.info({ fileName, subject: formsByFileName[fileName].subject }, 'Using custom subject');
    return formsByFileName[fileName].subject;
  } else {
    return 'Polarity Form Submission';
  }
}

async function getTemplate({ user, entity, integrationData, formName, fields, fileName }) {
  let subject = getEmailSubject(fileName);
  Logger.trace({ user, entity, integrationData, formName, fields, fileName, subject }, 'Building template');

  const template = await emailer.renderAll('rfi-hbs', {
    integrationData,
    entity,
    user,
    formName,
    fields,
    subject
  });

  return template;
}

async function sendEmail(template, user, fileName, recipient, options) {
  const emailSettings = {
    text: template.text,
    from: options.sender.length > 0 ? options.sender : `"${user.fullName}" <${user.email}>`,
    to: getRecipient(fileName, recipient, options),
    subject: template.subject,
    html: template.html
  };

  Logger.debug({ emailSettings, fn: 'send' }, 'Sending Email');

  return new Promise((resolve, reject) => {
    smtpClient.sendMail(emailSettings, (err, result) => {
      if (err) {
        Logger.error(err, 'Error sending email');
        reject(err);
      } else {
        Logger.trace({ result }, 'Result');
        resolve();
      }
    });
  });
}

function maybeLoadForms(options) {
  if (forms.length === 0 || previousFormSelection !== options.forms) {
    forms = [];
    formsByFileName = {};
    options.forms
      .split(',')
      .map((form) => form.trim())
      .forEach((formName) => {
        const form = require(`${FORMS_DIRECTORY}/${formName}.json`);
        if (!Array.isArray(form.elements)) {
          throw {
            detail: `The form "${formName}" does not have an "elements" property defined.  Please add an "elements" property to the form and try again.`
          };
        }
        form.elements = form.elements.map((element, elementIndex) => {
          if (!element.type) {
            Logger.error(
              { element, elementIndex },
              `The form element at index "${elementIndex}" from "${interfaceName}.json" does not have a "type" property defined.  Please add a "type" to the element and try again.`
            );

            throw {
              elementIndex,
              element,
              detail: `The form element at index "${elementIndex}" from "${interfaceName}.json" does not have a "type" property defined.  Please add a "type" to the element and try again.`
            };
          }

          validateRequiredFields(element.type, Object.keys(element));
          return Object.assign({}, formDefaults[element.type], element);
        });
        form.fileName = formName;
        forms.push(form);
        formsByFileName[formName] = form;
      });

    previousFormSelection = options.forms;
    Logger.trace({ forms }, 'Forms Loaded');
  }
}

function validateRequiredFields(elementType, availableFields) {
  const requiredFields = formRequiredFields[elementType];

  if (!requiredFields) {
    throw {
      detail: `The form element of type "${elementType}" is not supported.  Please use one of the following types: ${Object.keys(
        formRequiredFields
      ).join(', ')}`
    };
  }

  requiredFields.forEach((requiredField) => {
    if (!availableFields.includes(requiredField)) {
      Logger.error(
        { elementType, availableFields, requiredField },
        `The form element is missing the required field: ${requiredField}`
      );
      throw {
        elementType,
        availableFields,
        requiredField,
        detail: `The form element is missing the required field: ${requiredField}`
      };
    }
  });
}

async function getAvailableForms() {
  const fileNames = await readdir(FORMS_DIRECTORY);
  return fileNames.reduce((accum, fileName) => {
    if (fileName.endsWith('.json')) {
      accum.push(fileName.slice(0, -5));
    }
    return accum;
  }, []);
}

const parseErrorToReadableJSON = (error) => JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));

async function onMessage(payload, options, cb) {
  Logger.trace({ payload }, 'onMessage');

  maybeInitSmtp(options);
  maybeSetupTemplateBuilder();

  try {
    const template = await getTemplate(payload, options);

    if (options.deliveryMethod.value === 'email' || options.deliveryMethod.value === 'emailAndLog') {
      await sendEmail(template, payload.user, payload.fileName, payload.recipient, options);
    }

    if (options.deliveryMethod.value === 'log' || options.deliveryMethod.value === 'emailAndLog') {
      Logger.info(template.text, 'Form submitted');
    }

    cb(null, {
      detail: 'Success'
    });
  } catch (sendEmailError) {
    const jsonError = parseErrorToReadableJSON(sendEmailError);
    Logger.error({ error: jsonError }, 'Error submitting form');
    cb({
      detail: 'Error encountered submitting form',
      error: jsonError
    });
  }
}

async function validateSmtpOptions(userOptions) {
  return new Promise((resolve, reject) => {
    let errors = [];
    let formattedOptions = {};
    for (const option in userOptions) {
      formattedOptions[option] = userOptions[option].value;
    }

    setupSmtpClient(formattedOptions);
    setupTemplateBuilder();

    Logger.trace({ formattedOptions }, 'Validating SMTP Options');

    smtpClient.verify((smtpError, success) => {
      if (smtpError) {
        let smtpKeys = ['smtpHost', 'smtpPort', 'smtpConnectionSecurity'];
        if (userOptions.smtpUser.value.length > 0 || userOptions.smtpPassword.value.length > 0) {
          smtpKeys.push('smtpUser', 'smtpPassword');
        }
        smtpKeys.forEach((key) => {
          errors.push({
            key,
            message: `SMTP Connection Error: ${smtpError}`
          });
        });
        Logger.error({ smtpError, polarityErrors: errors }, 'Got an error back');
      }
      resolve(errors);
    });
  });
}

async function validateOptions(userOptions, cb) {
  Logger.trace({ userOptions }, 'Validating Options');
  let errors = [];

  if (
    typeof userOptions.recipient.value !== 'string' ||
    (typeof userOptions.recipient.value === 'string' && userOptions.recipient.value.length === 0)
  ) {
    errors.push({
      key: 'recipient',
      message: 'You must provide a default recipient email address'
    });
  }

  if (
    typeof userOptions.forms.value !== 'string' ||
    (typeof userOptions.forms.value === 'string' && userOptions.forms.value.length === 0)
  ) {
    errors.push({
      key: 'forms',
      message: 'You must provide a valid forms name'
    });
  } else {
    const availableForms = await getAvailableForms();
    Logger.trace({ availableForms }, 'Available forms');
    let forms = userOptions.forms.value.split(',').map((form) => form.trim());
    forms.forEach((form) => {
      if (!availableForms.includes(form)) {
        errors.push({
          key: 'forms',
          message: `${form} is not a valid form name.  Valid names are: ${availableForms.join(', ')}`
        });
      }
    });
  }

  if (userOptions.deliveryMethod.value.value === 'email' || userOptions.deliveryMethod.value.value === 'emailAndLog') {
    errors = errors.concat(await validateSmtpOptions(userOptions));
  }

  cb(null, errors);
}

module.exports = {
  startup,
  doLookup,
  onMessage,
  validateOptions
};
