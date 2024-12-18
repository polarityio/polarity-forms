module.exports = {
  name: 'Polarity Forms',
  acronym: 'FORM',
  description: 'Display customized forms to users for gathering user feedback or input.',
  logging: {
    level: 'info' //trace, debug, info, warn, error, fatal
  },
  styles: ['./styles/style.less'],
  entityTypes: ['domain', 'IPv4', 'IPv6', 'IPv4CIDR', 'email', 'MD5', 'SHA1', 'SHA256', 'cve', 'url'],
  defaultColor: 'light-gray',
  block: {
    component: {
      file: './components/block.js'
    },
    template: {
      file: './templates/block.hbs'
    }
  },
  request: {
    cert: '',
    key: '',
    passphrase: '',
    ca: '',
    proxy: ''
  },
  onDemandOnly: true,
  options: [
    {
      key: 'deliveryMethod',
      name: 'Form Delivery Method',
      description: 'Choose how form data should be delivered.  The default is "Email".',
      default: {
        value: 'email',
        display: 'Email - form data will be sent to the configured email address (SMTP settings must be configured)'
      },
      type: 'select',
      options: [
        {
          value: 'email',
          display: 'Email - form data will be sent to the configured email address (SMTP settings must be configured)'
        },
        {
          value: 'log',
          display: 'Log File - form data will be logged as JSON in the integration log file'
        },
        {
          value: 'emailAndLog',
          display: 'Email and Log File - form data will be sent via email and logged (SMTP settings must be configured)'
        }
      ],
      multiple: false,
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'smtpHost',
      name: 'SMTP Host',
      description: 'Your SMTP server hostname.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'smtpPort',
      name: 'SMTP Server Port',
      description: 'Your SMTP server port.',
      default: 25,
      type: 'number',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'smtpUser',
      name: 'SMTP User',
      description: 'Your SMTP username.  Leave blank for unauthenticated SMTP servers.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'smtpPassword',
      name: 'SMTP Server Password',
      description: 'Your SMTP password. Leave blank for unauthenticated SMTP servers.',
      default: '',
      type: 'password',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'smtpConnectionSecurity',
      name: 'SMTP Connection Security',
      description: 'The type of connection security to use when connecting to the SMTP server.',
      default: {
        value: 'none',
        display: 'Default (STARTTLS used if supported by the SMTP Server)'
      },
      type: 'select',
      options: [
        {
          value: 'none',
          display: 'Default (STARTTLS used if supported by the SMTP Server)'
        },
        {
          value: 'starttls',
          display: 'Force STARTTLS (force use of STARTTLS)'
        },
        {
          value: 'tls',
          display: 'TLS'
        }
      ],
      multiple: false,
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'sender',
      name: 'Sender Email Address',
      description:
        "The sender email address for all emails sent by the integration.  If left blank, the submitting Polarity user's email address will be used.",
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'recipient',
      name: 'Default Recipient Email Address',
      description:
        'The default email address to send form submissions to if a form configuration does not specify a recipient.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'cc',
      name: 'Default CC Email Address',
      description:
        'The default email address to CC form submissions to if a form configuration does not specify a CC.  If left blank, no CC will be sent.',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'forms',
      name: 'Enabled Forms',
      description:
        'A comma delimited list of forms that should be available when interacting with this integration.  Forms should be referred to by their filename (not including the `.json` file extension).',
      default: 'support, rfi, detect_feedback, detect_new, sample',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'includeIntegrationNames',
      name: 'Include Integration Names and Summary Tags',
      description:
        'If checked, the email will include the name of integrations the user had access to when submitting the form as well as summary tags.',
      default: true,
      type: 'boolean',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'summaryTag',
      name: 'Summary Tag',
      description: "Customize the integration's summary tag",
      default: 'Polarity Form',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'showFormByDefault',
      name: 'Show Forms By Default',
      description:
        'If checked, the integration will show the forms by default.  If unchecked, the user will need to click to expand and view the forms.',
      default: true,
      type: 'boolean',
      userCanEdit: true,
      adminOnly: false
    }
  ]
};
