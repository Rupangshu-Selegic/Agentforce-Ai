import 'dotenv/config';
import { chatCompletion } from './modelsApi.js';

const SYSTEM_PROMPT = 'Think like a Salesforce consultent';
const USER_MESSAGE  = 'We want to build a generic Rule Execution Framework in Salesforce RLM that can execute different types of rules such as Qualification Rules, Selection Rules, Pricing Rules, Validation Rules, Compatibility Rules, and Recommendation Rules. The framework should be metadata-driven, support rule priorities, execution order, rule dependencies, conditional execution, rollback on failure, and detailed execution logs. Generate a complete enterprise-grade Apex solution, including architecture diagrams, interfaces, service classes, factories, utility classes, test classes, and recommendations for optimizing governor limits and performance.';

async function main() {
  console.log('\n Salesforce Agentforce Models API — Call');
  console.log('='.repeat(55));
  console.log(`System : ${SYSTEM_PROMPT}`);
  console.log(`User   : ${USER_MESSAGE}`);
  console.log('-'.repeat(55));

  try {
    const response = await chatCompletion(SYSTEM_PROMPT, USER_MESSAGE);
    console.log('\n AI Response:');
    console.log(response);
    console.log('\n' + '='.repeat(55));
  } catch (err) {
    console.error('\n Error:', err.message);
    process.exit(1);
  }
}

main();