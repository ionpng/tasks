<script>
    let tasks = [];
    let newTask = "";
  
    function addTask() {
      if (newTask) {
        tasks = [...tasks, { text: newTask, completed: false }];
        newTask = "";
      }
    }
  
    function deleteTask(index) {
      tasks = tasks.filter((_, i) => i !== index);
    }
  
    function toggleComplete(index) {
      tasks[index].completed = !tasks[index].completed;
    }
  </script>
  
  <div class="container mx-auto p-4">
    <div class="flex items-center mb-4">
      <input
        class="border-2 border-gray-300 bg-white h-10 px-5 pr-16 rounded-lg text-sm focus:outline-none shadow-md w-full"
        type="text"
        placeholder="Add a task"
        bind:value={newTask}
        on:keydown={(e) => e.key === 'Enter' && addTask()}
      />
      <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2 shadow-md"
        on:click={addTask}
      >
        Add
      </button>
    </div>
    <ul class="list-disc pl-5 mt-4">
      {#each tasks as task, index (index)}
        <li class="flex justify-between items-center mb-2 bg-white p-4 rounded-lg shadow-md">
          <span class="font-medium text-gray-700" class:line-through={task.completed}>{task.text}</span>
          <div>
            <button
              class="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded shadow-md mr-2"
              on:click={() => toggleComplete(index)}
            >
              {task.completed ? 'Undo' : 'Complete'}
            </button>
            <button
              class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded shadow-md"
              on:click={() => deleteTask(index)}
            >
              Delete
            </button>
          </div>
        </li>
      {/each}
    </ul>
  </div>