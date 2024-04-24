<script>
  import { onMount } from 'svelte';
  import { fetchTasks, sendTask, delTask } from '$lib/supabaseClient.js';
  import { v4 as uuidv4 } from 'uuid';

  let uuid = uuidv4();
  console.log(uuid)
  // existing code...

  let tasks = [];
  let newTask = "";
  let newTaskType = "test"; // default task type
  let newTaskDescription = "";
  let newTaskDueDate = null;

  let filter = "all"; // default filter

  $: filteredTasks = filter === "all" ? tasks : tasks.filter(task => task.task_type === filter);
  $: {
      fetchTasks(uuid).then(data => {
        if (data){
          tasks = data;
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
      completed: false 
    };
    console.log(task)
    tasks = [...tasks, task];
    newTask = "";
    newTaskDescription = "";
    newTaskDueDate = null;
    await sendTask(task.task_name, task.task_type, task.task_description, task.task_due_date, uuid); 
    // Fetching tasks after addition
    fetchTasks(uuid).then(data => {
      if (data){
        tasks = data;
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


  function toggleComplete(index) {
    tasks[index].completed = !tasks[index].completed;
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

<div class="flex h-screen bg-gray-100">
  <!-- Sidebar -->
  <div class="w-64 bg-white shadow-md">
    <div class="px-6 py-4">
      <h1 class="text-xl font-bold text-gray-800 mb-4">Tasks</h1>
      <input class="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500" type="text" bind:value={uuid} placeholder="Enter UUID" />
      <p class="block text-sm font-medium text-gray-700 mb-1">Task Type</p>
      <select bind:value={newTaskType} class="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500">
        <option value="test">Test</option>
        <option value="homework">Homework</option>
        <option value="project">Project</option>
      </select>
      <p class="block text-sm font-medium text-gray-700 mb-1">Task Description</p>
      <input class="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500" type="text" bind:value={newTaskDescription} placeholder="Enter Description" />
      <p class="block text-sm font-medium text-gray-700 mb-1">Task Due Date</p>
      <input class="w-full mb-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500" type="text" bind:value={newTaskDueDate} placeholder="Enter Due Date" />
      <p class="block text-sm font-medium text-gray-700 mb-1">Filter</p>
      <div class="mb-4">
        <button class="{filter === 'all' ? 'bg-blue-500 text-white focus:outline-none focus:ring focus:ring-blue-500' : 'bg-gray-100 text-gray-700 focus:outline-none focus:ring focus:ring-blue-500'} w-full px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200" on:click={() => filter = "all"}>All</button>
        <button class="{filter === 'test' ? 'bg-blue-500 text-white focus:outline-none focus:ring focus:ring-blue-500' : 'bg-gray-100 text-gray-700 focus:outline-none focus:ring focus:ring-blue-500'} w-full px-4 py-2 mt-2 text-sm font-medium rounded-md hover:bg-gray-200" on:click={() => filter = "test"}>Tests</button>
        <button class="{filter === 'homework' ? 'bg-blue-500 text-white focus:outline-none focus:ring focus:ring-blue-500' : 'bg-gray-100 text-gray-700 focus:outline-none focus:ring focus:ring-blue-500'} w-full px-4 py-2 mt-2 text-sm font-medium rounded-md hover:bg-gray-200" on:click={() => filter = "homework"}>Homework</button>
        <button class="{filter === 'project' ? 'bg-blue-500 text-white focus:outline-none focus:ring focus:ring-blue-500' : 'bg-gray-100 text-gray-700 focus:outline-none focus:ring focus:ring-blue-500'} w-full px-4 py-2 mt-2 text-sm font-medium rounded-md hover:bg-gray-200" on:click={() => filter = "project"}>Projects</button>
      </div>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="flex-1 overflow-y-auto p-4">
    <div class="flex items-center mb-4">
      <input
        class="border border-gray-300 bg-white h-10 px-5 pr-16 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md flex-1"
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
      {#each filteredTasks as task, index (index)}
      <li class="flex justify-between items-center mb-2 bg-white p-4 rounded-lg shadow-md" draggable="true" on:dragstart={() => dragStart(index)} on:dragover={(e) => dragOver(e)} on:drop={() => drop(index)}>
        <span class="flex items-center">
            <!-- Colored indicator based on task type -->
            <span class="{getTaskTypeIndicatorClass(task.task_type)} w-3 h-3 mr-2 rounded-full"></span>
            <span class="font-medium text-gray-700" class:line-through={task.completed}>
                {task.task_name} {#if task.task_description} - {task.task_description} {/if}             </span>
            </span>
            {#if task.task_due_date}
            <span class="text-gray-500 ml-4">Due: {task.task_due_date}</span>
            {/if}
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
</div>
