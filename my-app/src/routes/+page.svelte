<script>
  import { onMount } from 'svelte';
  import { fetchTasks, sendTask, delTask, updateTaskCompletion } from '$lib/supabaseClient.js';
  import Edit from '$lib/components/Edit.svelte'
  let uuid;
  let isEditing;
  let editTask;

  async function getIPAddress() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      uuid = data.ip;
    } catch (error) {
      console.error('Error fetching IP address:', error);
    }
  }

  onMount(() => {
    getIPAddress();
  });
  
  let originalTasks = []; // Store the original unfiltered list of tasks
  let tasks = [];
  let newTask = "";
  let newTaskType = "test"; // default task type
  let newTaskDescription = "";
  let newTaskDueDate = null;

  let filter = "all"; // default filter

  $: filteredTasks = filter === "all"
    ? tasks.filter(task => !task.task_completed) // Only show incomplete tasks in "All"
    : filter === "completed"
        ? tasks.filter(task => task.task_completed) // Only show completed tasks in "Completed"
        : tasks.filter(task => task.task_type === filter && !task.task_completed); // Show tasks of selected type that are not completed
  $: {
      fetchTasks(uuid).then(data => {
        if (data){
          tasks = data;
          originalTasks = data.slice(); // Copy the fetched tasks to originalTasks
        } 
      });
    }
    async function addTask() {
  if (newTask) {
    let task = { 
      task_name: newTask, 
      task_type: newTaskType, 
      task_description: newTaskDescription,
      task_due_date: newTaskDueDate,
      task_completed: false
    };
    console.log(task)
    tasks = [...tasks, task];
    originalTasks = [...originalTasks, task]; // Add task to the originalTasks list
    newTask = "";
    newTaskDescription = "";
    newTaskDueDate = null;
    await sendTask(task.task_name, task.task_type, task.task_description, task.task_due_date, task.task_completed, uuid); 
    // Fetching tasks after addition
    fetchTasks(uuid).then(data => {
      if (data){
        tasks = data;
        originalTasks = data.slice(); // Update originalTasks after fetching
        console.log(tasks)
      } 
    });
  }
}

// Drag and drop functionality
let dragItemIndex = null;

function dragStart(index) {
  dragItemIndex = index;
}

function dragOver(e) {
  e.preventDefault();
}

function drop(index) {
  const draggedItem = tasks[dragItemIndex];
  const remainingTasks = tasks.filter((task, idx) => idx !== dragItemIndex);
  tasks = [
    ...remainingTasks.slice(0, index),
    draggedItem,
    ...remainingTasks.slice(index)
  ];
}


async function toggleComplete(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
        console.error('Task not found');
        return;
    }

    tasks[taskIndex].task_completed = !tasks[taskIndex].task_completed;

    try {
        await updateTaskCompletion(taskId, tasks[taskIndex].task_completed);
    } catch (error) {
        console.error('Error updating task completion:', error);
    }
}

async function deleteTask(index) {
    if (index < 0 || index >= tasks.length) {
        console.error('Invalid index', index);
        return;
    }

    let task = tasks[index];
    if (!task || !task.hasOwnProperty('id')) {
        console.error('Task or task ID is undefined');
        return;
    }

    let taskId = task.id;
    tasks = tasks.filter((_, i) => i !== index);
    
    try {
        const deletedTask = await delTask(taskId);
        if (!deletedTask) {
            console.error('Failed to delete task from Supabase');
        }
        else{
          console.log("Deleted task successfully")
        }
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

function getTaskTypeIndicatorClass(taskType) {
    switch (taskType) {
        case 'test':
            return 'bg-orange-500';
        case 'homework':
            return 'bg-yellow-500';
        case 'project':
            return 'bg-purple-500';
        default:
            return 'bg-gray-500'; // Default color if task type is not recognized
    }
}
</script>

<div class="flex h-screen bg-gray-50">
  <!-- Sidebar -->
  {#if isEditing}
	<button class="z-10 fixed flex h-screen w-screen items-center justify-center"
	on:click={() => {
		isEditing = false
    editTask = null
    fetchTasks(uuid).then(data => {
      if (data){
        tasks = data;
        originalTasks = data.slice(); // Update originalTasks after fetching
        console.log(tasks)
      } 
    });
	}}>
		<button on:click|stopPropagation>
			<Edit {editTask}/>
		</button>
	</button>

	{/if}

  <div class="w-64 bg-white shadow-lg">
    <div class="px-6 py-6">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6">Tasks</h1>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
        <input class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" bind:value={newTaskDescription} placeholder="Enter Description" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">Task Due Date</label>
        <input class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" bind:value={newTaskDueDate} placeholder="Enter Due Date" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Filter</label>
        <div class="space-y-2">
          <button class="{filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} w-full px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200" on:click={() => filter = 'all'}>All</button>
          <button class="{filter === 'test' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} w-full px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200" on:click={() => filter = 'test'}>Tests</button>
          <button class="{filter === 'homework' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} w-full px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200" on:click={() => filter = 'homework'}>Homework</button>
          <button class="{filter === 'project' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} w-full px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200" on:click={() => filter = 'project'}>Projects</button>
          <hr class="my-4 border-gray-300">
          <button class="{filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} w-full px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200" on:click={() => filter = 'completed'}>Completed</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="flex-1 overflow-y-auto p-8 bg-gray-50">
    <div class="flex items-center mb-6 space-x-4">
      <input
        class="border border-gray-300 bg-white h-12 px-5 pr-16 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm flex-1"
        type="text"
        placeholder="Add a task"
        bind:value={newTask}
        on:keydown={(e) => e.key === 'Enter' && addTask()}
      />
      <button
        class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-md"
        on:click={addTask}
      >
        Add
      </button>
    </div>
    <div class="mb-6">
      <label class="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
      <select bind:value={newTaskType} class="w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-gray-900 appearance-none">
        <option value="test" class="py-2 hover:bg-gray-100">Test</option>
        <option value="homework" class="py-2 hover:bg-gray-100">Homework</option>
        <option value="project" class="py-2 hover:bg-gray-100">Project</option>
      </select>
    </div>
    
    <ul class="space-y-4">
      {#each filteredTasks as task, index (index)}
      <li class="flex justify-between items-center bg-white p-4 rounded-lg shadow-md" draggable="true" on:dragstart={() => dragStart(index)} on:dragover={(e) => dragOver(e)} on:drop={() => drop(index)}>
        <span class="flex items-center">
          <!-- Colored indicator based on task type -->
          <span class="{getTaskTypeIndicatorClass(task.task_type)} w-4 h-4 mr-3 rounded-full"></span>
          <span class="font-medium text-gray-800" class:line-through={task.task_completed}>
            {task.task_name} {#if task.task_description} - {task.task_description} {/if}
          </span>
        </span>
        {#if task.task_due_date}
        <span class="text-gray-500 ml-4">Due: {task.task_due_date}</span>
        {/if}
        <div>
          <button
            class="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded shadow-md mr-2"
            on:click={() => toggleComplete(task.id)}
          >
            {task.task_completed ? 'Undo' : 'Complete'}
          </button>
          <button
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded shadow-md"
          on:click={() => {
            isEditing = true;
            editTask = task;
          }}
        >
          Edit
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
</div>
