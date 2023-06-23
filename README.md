To simplify the installation process, you can utilize this project by installing the GitHub app available at https://github.com/marketplace/code-autopilot-ai-coder. This app uses autopilot to automatically resolve issues that you open on GitHub. It provides an easy interface to use it and it’s how I have been using it personally.


<h1 align="center">Autopilot - An AI developer</h1>

<p align="center">
  <strong>Autopilot</strong> is an AI tool that utilizes GPT to read a codebase, create context, and solve tasks that you request.
</p>

<p align="center">
  <img src="public/demo.gif" alt="Autopilot Demo" width="800"/>
</p>

# How it works 

1. You point AutoPilot at a codebase with a task.
1. AutoPilot generates and upkeeps a DB with metadata on the codebase files. (within the codebase directory)
1. AutoPilot decides which existing files it needs for the task by using the metadata DB.
1. AutoPilot tries to implement the requested task on each relevant file.

## Features

- 📚 - Pre-processes codebase files.
- 🤖 - Implements code changes for you.
- 🚀 - Parallel calls to agents where possible.
- 📝 - Shows you what was updated. (Full process log with each AI interaction also produced)
- 🕹️ - Interactive mode - see the process with retry, continue, abort options.

### Tasks expectations
- Referencing current code:
  - ✅ Referencing a specific file by project relative path.
  - ✅ Referencing a specific file by file name only, ignoring the subdirectories path.
  - ✅ Referencing a specific function within a file without the filename.
  - ✅ Referencing a major business concept that is exclusively used in one file.
  - ✅ Referencing all project files.
  - 🤔 General logical requests. Your milage would differ by model, codebase and task. Some work. (Should introduce task scoring)
- Changes executed:
  - ✅Create a new file based on an existing file.
  - ❌Start a new file from scratch.
  - ✅Update an existing file.
  - ✅Update multiple existing files.
  - ❌Delete existing files. (It might empty them out, but not delete them currently)
  - ❌Start using new 3rd party libraries. (Needs arbitrary code execution to install the library)
  - ❌Cascade updating related files like tests. (Coming soon)
  - ❌Test the code it wrote and self fix.

## Prerequisites 
nodejs v18 or above.

## 🛠️ Installation

1. Clone the repository: `git clone https://github.com/fjrdomingues/autopilot.git`
2. Move to autopilot directory `cd autopilot` 
3. Install dependencies: `npm ci`
   
## Running
* `node ui -d "/CODE_DIRECTORY" -t "YOUR_TASK"` - is the easiest way to start.
  * First run will ask you for needed parameters. (OpenAI API key, include and exclude file lists)
  * Solutions will be auto applied on your code and a git diff shown if possible. 
    * Alternatively you may specify `--auto-apply=false`.
* `node ui -h` - will show you all the options.

## Interactive mode
Use `node ui -i` for an interactive mode, here you can review the output of each step before proceeding.

## Advance config
If you are only working on one project, you might want to setup CODE_DIR in your personal config file.
Take a look at the `.env.default` file for more options.
You can see any of them in either your personal config file or the codebase config file. (codebase config file takes precedence)

## 🤝 Contributing

**We are running autopilot on a server connected to the https://github.com/fjrdomingues/autopilot repository. New issues created will trigger autopilot and create a new Pull Request with a proposal. Running with gpt-4**

We welcome contributions! Please submit pull requests to the repository, and ensure your changes align with the project's goals and guidelines. Together, we can make **Autopilot** an even more powerful and efficient tool for developers!

### Running tests - all
`npm run test` - runs all the tests

### Running tests - Unit test
`npm run unit-test` - runs the unit tests

### Running tests - Benchmarks
`npm run e2e-test` - runs the end to end tests

### Code structure
- agents - interactions with language models.
- modules - most other internal libs.
- ui.js - The main().
- logs - document a task run.
