const { getLogger } = require('../src/logger');

module.exports = {
  prompt: `You will receive data from {{integrationNames}}.  The data will be in JSON format. Provide a short, concise summary of the provided data.  
  
  Follow these rules when creating the summary:
   1. The summary can only be 5 sentences or less. 
   2. Do not provide recommendations, tips, advice or other suggestions.
   3. Do not say what I should do.`,
  integrations: {
    greynoise: {
      prompt: `
This following JSON is data for {{entity}}:
\`\`\`json
{{details}}
\`\`\`
`,
      parseData: (data) => {
        const { details, summary } = data;
        delete details.apiService;
        delete details.hasResult;
        if (details.stats) {
          if (details.stats.destination_countries) {
            delete details.stats.destination_countries;
          }

          if (details.status.organizations) {
            delete details.stats.organizations;
          }

          if (Array.isArray(details.stats.tags)) {
            details.stats.tags = details.stats.tags.map((tag) => {
              return {
                tag: tag.tag,
                count: tag.count
              };
            });
          }
        }

        return data;
      }
    },
    'mandiant threat intelligence': {
      prompt: `
This following JSON is data for {{entity}}:
\`\`\`json
{{details}}
\`\`\`
`,
      parseData: (data) => {
        const { details, summary } = data;
        const parsedData = {};
        parsedData.reports = details.searchResults.map((result) => {
          return result.description;
        });

        return {
          details: parsedData,
          summary: data.summary
        };
      }
    },
    'cve search': {
      prompt: `
This following JSON is CVE data for {{entity}}:
\`\`\`json
{{details}}
\`\`\`
`,
      parseData: (data) => {
        const { details, summary } = data;
        delete details.capec;
        delete details.references;
        delete details.refmap;

        return data;
      }
    },
    'cisa known exploited vulnerabilities': {
      prompt: `
This following JSON is DHS CISA's Known Exploited Vulnerabilities data for {{entity}}:
\`\`\`json
{{details}}
\`\`\`
`,
      parseData: (data) => {
        return data;
      }
    },
    'exploit finder': {
      prompt: `
This following JSON is Exploit information for {{entity}} found on the Internet:
\`\`\`json
{{details}}
\`\`\`
`,
      parseData: (data) => {
        const { details, summary } = data;
        delete details.icons;
        let parsedDetails = details.searchResults.items.map((item) => {
          return {
            snippet: item.snippet,
            title: item.title,
            source: item.displayLink
          };
        });

        return {
          details: parsedDetails,
          summary: data.summary
        };
      }
    },
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
