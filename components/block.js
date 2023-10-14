'use strict';

polarity.export = PolarityComponent.extend({
  notificationsData: Ember.inject.service('notificationsData'),
  currentUser: Ember.inject.service('currentUser'),
  forms: Ember.computed.alias('block.data.details.forms'),
  selectedFormHasMultipleRecipients: Ember.computed('block._state.selectedFormIndex', function () {
    return this.hasMultipleRecipients(this.get('block._state.selectedFormIndex'));
  }),
  selectedFormHasRecipientDomains: Ember.computed('block._state.selectedFormIndex', function () {
    return this.hasRecipientDomains(this.get('block._state.selectedFormIndex'));
  }),
  showCustomRecipient: Ember.computed('block._state.selectedFormIndex', 'forms.@each._selectedRecipient', function () {
    let selectedFormIndex = this.get('block._state.selectedFormIndex');
    console.info('Form Index: ' + selectedFormIndex);
    let _selectedRecipient = this.get(`forms.${selectedFormIndex}._selectedRecipient`);
    console.info('showCustomRecipient ' + _selectedRecipient);
    // no recipient domains specified for the form so we never show custom recipient input
    if (!this.selectedFormHasRecipientDomains) {
      console.info('showCustomRecipient: false 1');
      return false;
    }

    // recipient domains are specified and no multi-recipient is specified
    if (this.selectedFormHasRecipientDomains && !this.selectedFormHasMultipleRecipients) {
      console.info('showCustomRecipient: true 2');
      return true;
    }

    if (
      this.selectedFormHasMultipleRecipients &&
      this.selectedFormHasRecipientDomains &&
      _selectedRecipient === 'custom'
    ) {
      console.info('showCustomRecipient: true 3');
      return true;
    }

    console.info('showCustomRecipient: false 4');
    return false;
  }),
  isExpanded: true,
  statusMessageIsVisible: false,
  statusMessageType: 'success', //valid values are 'success' and 'error'
  errorMessage: '',
  init() {
    if (!this.get('block._state')) {
      this.set('block._state', {});
      this.set('block._state.isSending', false);
      this.set('block._state.selectedFormIndex', 0);
      this.set('block._state.submissionHistory', Ember.A());
    }

    if (!this.get('block.userOptions.showFormByDefault')) {
      this.set('isExpanded', false);
    }

    // Set default values where applicable
    this.get('forms').forEach((form, formIndex) => {
      form.elements.forEach((element, elementIndex) => {
        if (element.default) {
          this.set(`forms.${formIndex}.elements.${elementIndex}.value`, element.default);
        }
      });
    });

    this._super(...arguments);
  },
  actions: {
    toggleIsExpanded: function () {
      this.toggleProperty('isExpanded');
    },
    sendTasking: function () {
      this.sendEmail();
    },
    closeError: function () {
      this.set('errorMessage', '');
    }
  },
  hasRecipientDomains(selectedFormIndex) {
    let recipientDomains = this.get(`forms.${selectedFormIndex}.recipientDomains`);
    return Array.isArray(recipientDomains);
  },
  hasMultipleRecipients(selectedFormIndex) {
    let recipient = this.get(`forms.${selectedFormIndex}.recipient`);
    return Array.isArray(recipient);
  },
  getIntegrationData() {
    let entityData = [];
    let notifications = this.notificationsData.getNotificationList();

    if (notifications.length > 0) {
      let currentNode = notifications.head;

      while (currentNode) {
        if (currentNode.primaryBlock.entity.value === this.get('block.entity.value')) {
          console.info(currentNode);
          let blocks = currentNode.blocks;
          let polarityBlock = blocks.findBy('type', 'polarity');
          let integrationBlocks = blocks.rejectBy('type', 'polarity');

          if (integrationBlocks && integrationBlocks.length > 0) {
            entityData = integrationBlocks.reduce((accum, block) => {
              if (block.name !== 'Polarity Tasker') {
                accum.push({
                  integrationName: block.name,
                  summary: block.data.summary
                  //details: block.data.details
                });
              }
              return accum;
            }, []);
          }
        }
        currentNode = currentNode.next;
      }

      console.info('Integration Data', entityData);
    }

    return entityData;
  },
  validateRequiredFields() {
    let selectedFormIndex = this.get('block._state.selectedFormIndex');
    let form = this.get(`forms.${selectedFormIndex}`);
    let valid = true;

    if (
      (this.hasMultipleRecipients(selectedFormIndex) &&
        this.get(`forms.${selectedFormIndex}._selectedRecipient`) === 'custom') ||
      (this.hasRecipientDomains(selectedFormIndex) && !this.hasMultipleRecipients(selectedFormIndex))
    ) {
      if (this.hasRecipientDomains(selectedFormIndex) && !form._customRecipient) {
        this.set(`forms.${selectedFormIndex}._recipientDomainError`, `Recipient is a required field.`);
        valid = false;
      }

      if (
        this.hasRecipientDomains(selectedFormIndex) &&
        form._customRecipient &&
        form._customRecipient.indexOf(' ') >= 0
      ) {
        this.set(`forms.${selectedFormIndex}._recipientDomainError`, `Recipient cannot contain spaces.`);
        valid = false;
      }

      if (
        this.hasRecipientDomains(selectedFormIndex) &&
        form._customRecipient &&
        form._customRecipient.indexOf('@') >= 0
      ) {
        this.set(`forms.${selectedFormIndex}._recipientDomainError`, `Recipient cannot contain an "at" (@) sign.`);
        valid = false;
      }
    }

    form.elements.forEach((element, elementIndex) => {
      if (element.required && !element.value) {
        this.set(`forms.${selectedFormIndex}.elements.${elementIndex}.error`, `${element.label} is a required field.`);
        valid = false;
      }
    });

    return valid;
  },
  showStatusMessage(message, type) {
    this.set('statusMessage', message);
    this.set('statusMessageType', type);
    this.set('statusMessageIsVisible', true);
    setTimeout(() => {
      if (!this.isDestroyed) {
        this.set('statusMessageIsVisible', false);
      }
    }, 2000);
  },
  clearElementErrors() {
    let selectedFormIndex = this.get('block._state.selectedFormIndex');
    let form = this.get(`forms.${selectedFormIndex}`);

    this.set(`forms.${selectedFormIndex}._recipientDomainError`, '');

    form.elements.forEach((element, elementIndex) => {
      this.set(`forms.${selectedFormIndex}.elements.${elementIndex}.error`, '');
    });
  },
  resetFormValues() {
    let selectedFormIndex = this.get('block._state.selectedFormIndex');
    let form = this.get(`forms.${selectedFormIndex}`);

    form.elements.forEach((element, elementIndex) => {
      let defaultValue = element.default ? element.default : '';
      this.set(`forms.${selectedFormIndex}.elements.${elementIndex}.value`, defaultValue);
      // let selectValues = this.get(`forms.${selectedFormIndex}.elements.${elementIndex}.values`);
      // if (Array.isArray(selectValues)) {
      //   alert('resetting select');
      //   this.set(`forms.${selectedFormIndex}.elements.${elementIndex}.values`, selectValues.sort().slice());
      //   this.get('block').notifyPropertyChange(
      //     'data.details.forms.${selectedFormIndex}.elements.${elementIndex}.values'
      //   );
      // }
    });
  },
  getRecipient: function () {
    let selectedFormIndex = this.get('block._state.selectedFormIndex');
    let customRecipient = this.get(`forms.${selectedFormIndex}._customRecipient`);

    if (this.selectedFormHasMultipleRecipients) {
      let dynamicRecipient = this.get(`forms.${selectedFormIndex}._selectedRecipient`);
      let _selectedRecipient = this.get(`forms.${selectedFormIndex}._selectedRecipient`);

      if (!dynamicRecipient) {
        dynamicRecipient = this.get(`forms.${selectedFormIndex}.recipient.0`);
      }

      // If the recipient is set to custom we don't return it, instead we move to the next
      // if statement which pulls the recipient information from the custom recipient input
      if (dynamicRecipient !== 'custom') {
        return dynamicRecipient;
      }
    }

    if (this.selectedFormHasRecipientDomains && customRecipient) {
      let selectedDomain = this.get(`forms.${selectedFormIndex}._selectedRecipientDomain`);
      if (!selectedDomain) {
        selectedDomain = this.get(`forms.${selectedFormIndex}.recipientDomains.0`);
      }
      return `${customRecipient}@${selectedDomain}`;
    }

    return null;
  },
  sendEmail: function (vote) {
    this.clearElementErrors();

    if (!this.validateRequiredFields()) {
      this.showStatusMessage('Missing required fields', 'error');
      return;
    }

    this.set('errorMessage', '');
    this.set('block._state.isSending', true);

    const fields = [];
    let selectedFormIndex = this.get('block._state.selectedFormIndex');
    this.get(`forms.${selectedFormIndex}.elements`).forEach((element) => {
      fields.push({
        label: element.label,
        value: element.value
      });
    });

    const payload = {
      action: 'SUBMIT_TASKING',
      entity: this.get('block.entity.value'),
      recipient: this.getRecipient(),
      integrationData: this.getIntegrationData(),
      fileName: this.get(`forms.${selectedFormIndex}.fileName`),
      formName: this.get(`forms.${selectedFormIndex}.name`),
      formDescription: this.get(`forms.${selectedFormIndex}.description`),
      fields,
      user: {
        email: this.currentUser.user.email,
        fullName: this.currentUser.user.fullName,
        username: this.currentUser.user.username
      }
    };

    this.sendIntegrationMessage(payload)
      .then((response) => {
        // If the submission was successful save the information in case the user wants to review it
        this.get('block._state.submissionHistory').pushObject(payload);
        this.showStatusMessage('Successfully submitted', 'success');
      })
      .catch((err) => {
        this.set('errorMessage', JSON.stringify(err, null, 2));
      })
      .finally(() => {
        if (!this.isDestroyed) {
          this.set('block._state.isSending', false);
        }
        this.clearElementErrors();
        this.resetFormValues();
      });
  }
});
