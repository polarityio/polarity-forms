# Polarity Forms Integration

The Polarity Forms integration enables users to submit form based feedback/requests via email.  The integration can
easily be customized with your own forms.

# Form Creation

The integration supports creating your own forms via `json` configuration files.  Each form is defined in a separate
configuration file saved in the integration's `forms` directory.  

A configuration file has the following properties:

**name** {string} _(Required)_ - The name of the form

**recipient** {string} _(Optional)_ - The email address to send the form to.  If not specified the form will be sent to the integration's default recipient.

**description** {string} _(Optional)_ - A description of the form

**elements** {array} _(Required)_ - An array of form elements

The following is an example form with a single `textarea` element specified:

```
{
  "name": "Support Request",
  "recipient": "support@company.internal",
  "description": "Send us a support request",
  "elements": [
    {
      "type": "textarea",
      "label": "Support Details",
      "placeholder": "Provide details about your request",
      "required": true
    }
  ]
}
```

## Form Elements

Each form is made up of one or more Form Elements which are specified within the `elements` array of the form configuration.  The following form elements are supported:

* input -- A text input box
* select -- A drop-down select box
* textarea -- A multi-line text input box
* links -- a list of links
* block -- a block of text to include HTML

### input

An `input` form element has the following properties:

**type** {string} _(required)_ - The type of form element (must be `input`)

**label** {string} _(required)_ - The label (or name) of the input

**default** {string} _(default: "")_ - The default value of the input

**required** {boolean} _(default: false)_ - Whether the input is required for the form to be submitted

**placeholder** {string} _(default: "")_ - A short description of what the input is for.  This is displayed to the user when the input is empty.  For longer instructions we recommend using the `description` property.

**description** {string} _(default: "")_ - A longer description of what the input is for.  This is displayed below the input.

Example `input` form element with all options specified:

```
{
  "type": "input",
  "label": "Subject",
  "required": true,
  "default": "My Subject",
  "placeholder": "Short description of the issue",
  "description": "Provide a short description of the issue you are experiencing"
}
```
### textarea

The `textarea` form element has the following attributes

```
type {string} (Required) - The type of form element (must be `textarea`)
label {string} (Required) - The label (or name) of the textarea
default {string} (default: "") - The default value of the textarea
required {boolean} (default: false) - Whether the textarea is required for the form to be submitted
placeholder {string} (default: "") - A short description of what the textarea is for.  This is displayed to the user when the input is empty.  For longer instructions we recommend using the `description` property.
description {string} (default: "") - A longer description of what the textarea is for.  This is displayed below the textarea.
rows {number} (default: 10) - The number of rows of text to display in the textarea
```

Example `textarea` form element:

```
{
  "type": "textarea",
  "label": "Description",
  "required": true,
  "placeholder": "Detailed description of the issue",
  "description": "Provide a detailed description of the issue you are experiencing",
  "rows": 5
}
```

### select

The `select` form element has the following attributes

```
type {string} (Required) - The type of form element (must be `select`)
label {string} (Required) - The label (or name) of the select box
default {string} (default: "") - The default value of the select box
required {boolean} (default: false) - Whether the select box is required for the form to be submitted
description {string} (default: "") - A longer description of what the select box is for.  This is displayed below the select box.
values {array} (Required) - An array of options to display in the select box
```

Example `select` form element with all options specified:

```
{
  "type": "select",
  "label": "Severity",
  "required": true,
  "description": "Select the severity of the issue you are experiencing",
  "values": [
    "Low - 24 Hours",
    "Medium - 8 hours",
    "High - 4 hours",
    "Urgent - 1 hour"
  ],
  "default": "Low - 24 Hours"
}
```

### links

The `links` form element is used to display link information to the user.  The `links` form element has the following attributes:

```
type {string} (Required) - The type of form element (must be `links`)
label {string} - The label for the links
links {array} (Required) - An array of link objects to display.    
```

A link object can contain the following attributes:

```
text {string} - The text to display for the link.  If not provided, the link will display the `href` value.
href {string} - The URL to link to (supports mailto: links)
afterIcon {string} - The name of a Font Awesome icon to display after the link
beforeIcon  {string} - The name of a Font Awesome icon to display before the link
```

Example `links` form element with all options specified:

```
{
  "type": "links",
  "label": "Useful Links",
  "links": [
    {
      "text": "Open Google",
      "href": "https://www.google.com",
      "afterIcon": "external-link-alt"
    },
    {
      "text": "Send us an email",
      "href": "mailto:support@customer.internal",
      "beforeIcon": "envelope"
    }
  ]
}
```

### block

The `block` form element is used to display general information to the user and is not an interactive form element.  The `block` form element has the following attributes:

```
type {string} (Required) - The type of form element (must be `block`)
label {string} - The label (or name) of the block
text {string} (Required) - The text to display in the block (also supports html)
```

Example `block` form element with all options specified:

```
{
  "type": "block",
  "label": "Block of Text",
  "text": "This is a block of text that can contain <b>html</b>"
}
```

## About Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making. For more information
about the Polarity platform please see:

https://polarity.io/
