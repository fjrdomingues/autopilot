# Dev Autopilot - Using GPT to implement code development tasks.

Introducing Dev Autopilot, an AI-driven tool specifically designed for software developers to enhance their productivity and efficiency. By leveraging advanced GPT AI technology, Dev Autopilot streamlines code generation and project navigation, making it easier for developers to focus on implementing solutions.

How Dev Autopilot Works for Developers:

File Summarization: Automatically scans your project's files and generates concise mental models in the form of summaries.
Summary Storage: Conveniently saves summaries as .ai.txt files right next to the source files for quick access and reference.
UI and Interaction: Analyzes the given TASK, pinpoints relevant files and context, and suggests actionable changes, enabling you to manually apply the modifications with confidence.
Dev Autopilot is the ultimate coding companion for software developers, optimizing your workflow and reducing the time spent on mundane tasks so that you can focus on what truly matters: building exceptional software.

## Installation

1. Clone the repository: `git clone https://github.com/user/repo.git`
2. Navigate to the project directory: `cd repo`
3. Install dependencies: `npm install`
4. Set up an OpenAI API key and update the `.env` file with the key: `OPENAI_API_KEY=<your-api-key>`

## Usage

To use the code summarization tool, follow these steps:

1. Navigate to the `ui.js` file and run it: `node ui.js`
2. Follow the prompts to provide the necessary input, including the task to complete and the relevant files.
3. The summarization tool will process the selected files and provide suggestions for the given task.
4. Suggestions will be saved in a `suggestions` folder inside the project directory.

### Relevant Functions

- `getRelevantFiles`: Asks the user to identify the main files in the codebase relevant to their task.
- `readAllSummaries`: Retrieves the context of all files in the project by reading their summaries.
- `suggestChanges`: Sends saved output to GPT and asks for necessary changes to complete the task.

## Components

- **createSummaryOfFiles.js**: Manages the code summarization process for JavaScript and TypeScript files.
- **gpt.js**: Implements the interaction with the OpenAI API to generate responses based on provided prompts.
- **ui.js**: Handles the user interface (UI) interaction and utilizes the GPT-based summaries to complete tasks.

## Dependencies

- fs
- path
- axios
- chokidar
- word-count
- dotenv
- OpenAI API

## Contributing

We welcome contributions! Please submit pull requests to the repository, and ensure your changes align with the project's goals and guidelines.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details. 🎉