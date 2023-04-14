document.getElementById('task-form').addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const taskInput = document.getElementById('task-input');
    const waitingMessage = document.getElementById('waiting-message');
    const output = document.getElementById('output');
  
    try {
      taskInput.disabled = true;
      waitingMessage.hidden = false;
      output.hidden = true;
  
      const response = await fetch('/api/process-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskInput.value }),
      });
  
      if (response.ok) {
        const responseData = await response.json();
        output.textContent = responseData.result;
        output.hidden = false;
      } else {
        alert('An error occurred while processing your task');
      }
    } catch (error) {
      alert(error);
    } finally {
      taskInput.disabled = false;
      waitingMessage.hidden = true;
    }
  });