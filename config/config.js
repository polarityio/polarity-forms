module.exports = {
  name: 'Polarity Tasker',
  acronym: 'TASK',
  description: 'Send a tasking request for additional information on an entity of interest.',
  logging: {
    level: 'trace' //trace, debug, info, warn, error, fatal
  },
  styles: ['./styles/style.less'],
  entityTypes: ['domain', 'IP', 'url', 'hash', 'cve'],
  block: {
    component: {
      file: './components/block.js'
    },
    template: {
      file: './templates/block.hbs'
    }
  },
  onDemandOnly: true,
  options: [
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
      description: 'Your SMTP username.  Leave blank for unauthenticated SMTP servers',
      default: '',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'smtpPassword',
      name: 'SMTP Server Password',
      description: 'Your SMTP server port.',
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
        value: 'tls',
        display: 'TLS'
      },
      type: 'select',
      options: [
        {
          value: 'none',
          display: 'None (STARTTLS used if supported)'
        },
        {
          value: 'starttls',
          display: 'STARTTLS (force STARTTLS)'
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
      key: 'recipient',
      name: 'Default Recipient Email Address',
      description: 'The default email address to send tasking requests to if a form does not specify a recipient.',
      default: 'customersuccess@polarity.io',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'includeIntegrationNames',
      name: 'Include Integration Names',
      description:
        'If checked, the email will include the name of integrations the user had access to when submitting the task',
      default: true,
      type: 'boolean',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'forms',
      name: 'Form Names',
      description: 'A comma delimited list of form names you intend to use when interacting with this integration',
      default: 'default',
      type: 'text',
      userCanEdit: false,
      adminOnly: true
    },
    {
      key: 'showFormByDefault',
      name: 'Show Forms By Default',
      description: 'If checked, the integration will show the forms by default.  If unchecked, the user will need to click to expand and view the forms.',
      default: true,
      type: 'boolean',
      userCanEdit: true,
      adminOnly: false
    }
  ]
};
