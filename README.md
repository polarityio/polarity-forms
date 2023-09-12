# Polarity Tasker Integration

# User Interface Creation

Inputs

```
{
  "type": "input"
}
```

Inputs support the following properties:

### label {string} (Required)

The label (or name) for the input. Should be be short and descriptive of what the input is for.

### required {boolean} (default: false)

Whether the user is required to fill-in the input.

### placeholder {string} (default: "")

A short description of what the input is for. This is displayed to the user when the input is empty. For longer
instructions we recommend using the `description` property.

### description {string} (default: "")

A longer description of what the input is for. This is displayed below the input.

> We do not recommend specifying both a `placeholder` and `description` property as it can clutter the interface.

### defaultValue {string} (default: "")

A default value for the input.

## About Polarity

Polarity is a memory-augmentation platform that improves and accelerates analyst decision making. For more information
about the Polarity platform please see:

https://polarity.io/
