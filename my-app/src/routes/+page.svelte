<script>
    let tasks = [];
    let newTask = "";
    let newTaskType = "test"; // default task type
    let filter = "all"; // default filter
    $: filteredTasks = filter === "all" ? tasks : tasks.filter(task => task.type === filter);
  
    
    function addTask() {
      if (newTask) {
        tasks = [...tasks, { text: newTask, type: newTaskType, completed: false }];
        newTask = "";
      }
    }
  
    function deleteTask(index) {
      tasks = tasks.filter((_, i) => i !== index);
    }
  
    function toggleComplete(index) {
      tasks[index].completed = !tasks[index].completed;
    }
  
    function filteredTasks() {
      if (filter === "all") {
        return tasks;
      } else {
        return tasks.filter(task => task.type === filter);
      }
    }
  </script>
  
  <div class="container mx-auto p-4">
    <div class="flex items-center mb-4">
      <select bind:value={newTaskType} class="border border-gray-300 bg-white h-10 px-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md mr-2">
        <option value="test">Test</option>
        <option value="homework">Homework</option>
        <option value="project">Project</option>
      </select>
      <input
        class="border border-gray-300 bg-white h-10 px-5 pr-16 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md w-full"
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
    <div class="mb-4">
        <button class="{filter === 'all' ? 'bg-white-500  border-blue-500' : 'bg-white text-gray-700'} mr-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" on:click={() => filter = "all"}>All</button>
        <button class="{filter === 'test' ? 'bg-white-500 border-blue-500' : 'bg-white text-gray-700'} mr-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" on:click={() => filter = "test"}>Tests</button>
        <button class="{filter === 'homework' ? 'bg-white-500 border-blue-500' : 'bg-white text-gray-700'} mr-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" on:click={() => filter = "homework"}>Homework</button>
        <button class="{filter === 'project' ? 'bg-white-500 border-blue-500' : 'bg-white text-gray-700'} px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" on:click={() => filter = "project"}>Projects</button>
      </div>
    <ul class="list-disc pl-5 mt-4">
      {#each filteredTasks as task, index (index)}
        <li class="flex justify-between items-center mb-2 bg-white p-4 rounded-lg shadow-md">
          <span class="font-medium text-gray-700" class:line-through={task.completed}>{task.text} ({task.type})</span>
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

