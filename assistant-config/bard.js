const { getLogger } = require('../src/logger');

module.exports = {
  prompt: `You will receive data from {{integrationNames}}.  The data will be in JSON format.  Provide a concise summary of all the provided for use by a time-strapped analyst.  The summary of the data should be no longer than two paragraphs.  Do not provide recommendations or tips.`,
  integrations: {
    virustotal: {
      prompt: `
This following JSON is VirusTotal data for {{entity}}:
\`\`\`json
{{details}}
\`\`\`
`,
      parseData: (data) => {
        const { details, summary } = data;
        delete details.negativeScans;
        delete details.compiledBaselineInvestigationRules;
        delete details.behaviorLink;
        delete details.communityLink;
        delete details.detailsLink;
        delete details.relationsLink;
        delete details.detectionsLink;

        return data;
      }
    },
    shodan: {
      prompt: `
This following JSON is Shodan data for {{entity}}:
\`\`\`json
{{details}}
\`\`\`
`,
      parseData: (data) => {
        const { details, summary } = data;
        delete details.data;
        return data;
      }
    },
    'google drive': {
      prompt: `
This following JSON are file names from Google Drive that reference {{entity}}:
\`\`\`json
{{details}}
\`\`\`
`,
      parseData: (data) => {
        const { details, summary } = data;

        let parsedDetails = details.files.map((file) => {
          return {
            name: file.name,
            last_modifying_user: file.lastModifyingUser.displayName
          };
        });

        return {
          details: parsedDetails,
          summary: data.summary
        };
      }
    },
    servicenow: {
      prompt: `
This following JSON are incidents from ServiceNow that reference {{entity}}:
\`\`\`json
{{details}}
\`\`\`
`,
      parseData: (data) => {
        const { details, summary } = data;

        let parsedDetails = details.tableQueryData.map((item) => {
          return {
            label: item.label,
            value: item.value
          };
        });

        return {
          details: parsedDetails,
          summary: data.summary
        };
      }
    }
  }
};
