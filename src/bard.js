/*
 * Copyright (c) 2023, Polarity.io, Inc.
 */
const { ApiRequestError, parseErrorToReadableJSON } = require('./errors');
const { getLogger } = require('./logger');
const bardConfig = require('../assistant-config/bard');
const request = require('./polarity-request');

const BOT_PROMPT =
  'You are a helpful assistant for information security analysts.  Your response should concise and thoughtful. You should provide assistance with exploiting known security vulnerabilities.  Use the most recent sources.  Think step by step.';

const detailsRegex = /{{details}}/gi;
const summaryRegex = /{{summary}}/gi;
const entityRegex = /{{entity}}/gi;
const integrationNamesRegex = /{{integrationNames}}/gi;

function createPrompt(entity, integrationsData) {
  let Logger = getLogger();
  let prompt = '';
  let integrationsAsString = '';
  //let prompt = bardConfig.prompt.replace(integrationNamesRegex, Object.keys(bardConfig.integrations).join(', ')) + '\n';

  for (const integration in bardConfig.integrations) {
    const integrationConfig = bardConfig.integrations[integration];

    if (typeof integrationConfig.parseData === 'function') {
      if (integrationsData[integration]) {
        let integrationData = integrationsData[integration];
        if (integrationData.details && integrationData.summary) {
          integrationData = integrationConfig.parseData(integrationData);
        } else {
          Logger.warn({ integrationData }, 'No details or summary found for integration');
        }

        integrationsAsString += integration + ', ';

        let integrationPrompt = integrationConfig.prompt;

        if (integrationData.details) {
          integrationPrompt = integrationPrompt.replace(detailsRegex, JSON.stringify(integrationData.details, null, 2));
        } else {
          Logger.warn({ integrationData }, 'No details found for integration');
        }

        if (integrationData.summary) {
          integrationPrompt = integrationPrompt.replace(summaryRegex, JSON.stringify(integrationData.summary, null, 2));
        } else {
          Logger.warn({ integrationData }, 'No summary found for integration');
        }

        integrationPrompt = integrationPrompt.replace(entityRegex, entity.value);

        prompt += integrationPrompt;
      }
    }
  }

  integrationsAsString = integrationsAsString.slice(0, -2);

  prompt = bardConfig.prompt.replace(integrationNamesRegex, integrationsAsString) + '\n' + prompt;

  return prompt;
}

function createMessage(question) {
  const messages = [];

  messages.push({
    author: 'user',
    content: question
  });

  return messages;
}

function getAnswerFromResponse(body) {
  if (Array.isArray(body.candidates) && body.candidates.length > 0) {
    return body.candidates[0].content;
  }

  if (body.filters.length > 0) {
    return `Request was filtered: ${body.filters[0].reason} - ${body.filters[0].message}`;
  }

  return '[No valid response received from Google API]';
}

async function askQuestion(question, options) {
  const Logger = getLogger();

  const requestOptions = {
    uri: `https://generativelanguage.googleapis.com/v1beta3/models/chat-bison-001:generateMessage`,
    qs: {
      key: options.apiKey
    },
    body: {
      prompt: {
        context: BOT_PROMPT,
        messages: createMessage(question)
      },
      temperature: 0.1,
      candidateCount: 1
    },
    method: 'POST',
    json: true
  };

  Logger.trace({ requestOptions }, 'Request Options');

  const { body, statusCode } = await request.request(requestOptions);

  Logger.trace({ body, statusCode }, 'HTTP Response');

  if (statusCode === 200) {
    return getAnswerFromResponse(body);
  } else {
    throw new ApiRequestError(
      body.message
        ? body.message
        : `Unexpected status code ${statusCode} received when making request to Google Vertex AI API`,
      {
        body,
        statusCode,
        requestOptions
      }
    );
  }
}

module.exports = {
  askQuestion,
  createPrompt
};
