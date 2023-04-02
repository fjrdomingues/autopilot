<p align="center">
  <img src="banner.png" alt="Dev Autopilot Logo" width="200"/>
</p>

<h1 align="center">Dev Autopilot - Using GPT to Work on Entire Codebases</h1>

<p align="center">
  <strong>Dev Autopilot</strong> is an AI tool that utilizes GPT to read a codebase, create context, and solve tasks that you request.
</p>

<p align="center">
  <img src="demo.gif" alt="Dev Autopilot Demo" width="800"/>
</p>

## Features

### CreateSummaries script:

- 📚 Reads all relevant files in the project (first version supports `.js` files)
- 🧠 Creates a summary (using GPT AI API) representing a mental model for each file, allowing the app to work on larger codebases that wouldn't fit GPT's context window
- 💾 Saves the summary next to each file with a `.ai.txt` extension for later use
- 👀 A watcher continuously updates files that have been modified

### 🖥️ UI script:

- 🧩 Takes into account the TASK and retrieves all the summary files (`.ai.txt`)
- 🤖 Uses GPT AI API to identify relevant files for the task based on the summaries
- 📁 Retrieves the source code of each relevant file and sends it to GPT to obtain the necessary context
- 💾 Temporarily saves the output of each file
- 🔧 Sends the saved output to GPT and requests the required changes to complete the TASK
- 📋 Creates a `.md` file containing the suggestions to accomplish the TASK, along with the source code that can be used

## 🛠️ Installation

1. Clone the repository: `git clone https://github.com/user/repo.git`
2. Navigate to the project directory: `cd repo`
3. Install dependencies: `npm install`
4. Set up an OpenAI API key and update the `.env` file with the key: `OPENAI_API_KEY=<your-api-key>`

## Usage

To use the code summarization tool, follow these steps:

1. Navigate to the `ui.js` file and run it: `node ui.js`
2. Follow the prompts to provide the necessary input, including the task to complete and the relevant files
3. The summarization tool will process the selected files and provide suggestions for the given task
4. Suggestions will be saved in a `suggestions` folder inside the project directory

## Components

- **createSummaryOfFiles.js**: Manages the code summarization process for JavaScript and TypeScript files
- **gpt.js**: Implements the interaction with the OpenAI API to generate responses based on provided prompts
- **ui.js**: Handles the user interface (UI) interaction and utilizes the GPT-based summaries to complete tasks

## 🤝 Contributing

We welcome contributions! Please submit pull requests to the repository, and ensure your changes align with the project's goals and guidelines. Together, we can make **Dev Autopilot** an even more powerful and efficient tool for developers!
