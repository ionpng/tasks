<script>
  import { onMount } from 'svelte';
  import { fetchTasks, getFilterColor, fetchFilters, sendTask, delTask, updateTaskCompletion } from '$lib/supabaseClient.js';
  import Edit from '$lib/components/Edit.svelte'
  import AddFilter from '$lib/components/AddFilter.svelte';

  let uuid;
  let isEditing = false;
  let editTask = null;
  let filter = "all";
  let activeFilter = "all";
  let taskTypeColors = {}; // Dictionary to store task type colors

  async function getIPAddress() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      uuid = data.ip;
      return uuid
    } catch (error) {
      console.error('Error fetching IP address:', error);
    }
  }

  let originalTasks = [];
  let tasks = [];
  let newTask = "";
  let newTaskType = "test";
  let newTaskDescription = "";
  let newTaskDueDate = null;

  let originalFilters = [];
  let filters = [];
  let addFilter = false;

  const colorMap = {
    green: 'green',
    pink: 'pink',
    blue: 'blue',
    yellow: 'yellow',
    orange: 'orange',
    purple: 'purple',
    red: 'red',
    teal: 'teal',
    cyan: 'cyan',
    grey: 'grey',
    indigo: 'indigo',
    brown: 'brown',
  };

  $: filteredTasks = activeFilter === "all"
    ? tasks.filter(task => !task.task_completed)
    : activeFilter === "completed"
        ? tasks.filter(task => task.task_completed)
        : tasks.filter(task => task.task_type === activeFilter.filter_name && !task.task_completed);

  $: {
    if (uuid) {
      fetchTasks(uuid).then(data => {
        if (data) {
          tasks = data;
          originalTasks = data.slice();
          updateTaskTypeColors();
        }
      });
    }
  }

  async function updateTaskTypeColors() {
    const promises = tasks.map(async task => {
      if (!taskTypeColors[task.task_type]) {
        const color = await getFilterColor(task.task_type, uuid);
        taskTypeColors[task.task_type] = color || 'gray';
      }
    });
    await Promise.all(promises);
  }

  onMount(async () => {
    const ipData = await getIPAddress(); // Wait for IP address before using uuid
    if (ipData) {
      uuid = ipData;
      fetchTasks(uuid).then(data => {
        if (data) {
          tasks = data;
          originalTasks = data.slice();
          updateTaskTypeColors();
        }
      });
      fetchFilters(uuid).then(data => {
        if (data) {
          filters = data;
          originalFilters = data.slice();
          if (!filters.includes(newTaskType)) {
            newTaskType = filters[0];
          }
        }
      });
    } else {
      console.error("Failed to fetch IP address");
    }
  });

  async function addTask() {
    if (newTask) {
      let task = { 
        task_name: newTask, 
        task_type: newTaskType.filter_name, 
        task_description: newTaskDescription,
        task_due_date: newTaskDueDate,
        task_completed: false
      };
      tasks = [...tasks, task];
      originalTasks = [...originalTasks, task];
      newTask = "";
      newTaskDescription = "";
      newTaskDueDate = null;
      await sendTask(task.task_name, task.task_type, task.task_description, task.task_due_date, task.task_completed, uuid);
      fetchTasks(uuid).then(data => {
        if (data) {
          tasks = data;
          originalTasks = data.slice();
          updateTaskTypeColors();
        }
      });
    }
  }

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
    } catch (error) {
      console.error('Error deleting task:', error);
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
  {#if addFilter}
  <button class="z-10 fixed flex h-screen w-screen items-center justify-center"
  on:click={() => {
    addFilter = false
    fetchFilters(uuid).then(data => {
      if (data) {
        filters = data;
        filters = data.slice();
        // Update newTaskType based on available filters
        if (!filters.includes(newTaskType)) {
          newTaskType = filters[0]; // Set default task type to the first available filter
        }
      }
    })
    console.log(filters)
  }}>
    <button on:click|stopPropagation>
      <AddFilter {uuid} />
    </button>
  </button>
  {/if}
  <!-- Sidebar -->
  <div class="w-64 bg-white shadow-lg">
    <div class="px-6 py-6">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6">Tasks</h1>
      <div>
        <button class="bg-black text-white border border-black w-full px-4 py-2 text-sm font-medium rounded-md hover:bg-white hover:text-black hover:border-black mb-4" on:click={() => addFilter=true}>Add Filter</button>
        
        <label class="block text-sm font-medium text-gray-700 mb-1">Filter</label>
        <div class="space-y-2">
          <button class="{activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} w-full px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200" on:click={() => activeFilter = 'all'}>All</button>
          {#each filters as filter}
            <button 
              class="{filter === activeFilter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} w-full px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200" 
              on:click={() => activeFilter = filter}
            >
              {filter.filter_name}
            </button>
          {/each}
          <hr class="my-4 border-gray-300">
          <button class="{activeFilter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} w-full px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-200" on:click={() => activeFilter = 'completed'}>

Completed</button>
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
    <div class="flex items-center mb-6">
      <label class="text-sm font-medium text-gray-700 ml-8">Task Type</label>
      <select bind:value={newTaskType} class="w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-gray-900 appearance-none">
        {#each filters as filter}
          <option value={filter} class="py-2 hover:bg-gray-100">{filter.filter_name}</option>
        {/each}
      </select>
      
      <label class="text-sm font-medium text-gray-700 ml-8">Task Due Date</label>
      <input class="w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" bind:value={newTaskDueDate} placeholder="Enter Due Date" />
    
      <label class="text-sm font-medium text-gray-700 ml-8">Task Description</label>
      <input class="w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" bind:value={newTaskDescription} placeholder="Enter Description" />
    </div>
    <ul class="space-y-4">
      {#each filteredTasks as task, index (index)}
      <li class="flex justify-between items-center bg-white p-4 rounded-lg shadow-md" draggable="true" on:dragstart={() => dragStart(index)} on:dragover={(e) => dragOver(e)} on:drop={() => drop(index)}>
        <!-- Colored indicator based on task type -->
        <span class="w-4 h-4 mr-3 rounded-full block" style="background-color: {taskTypeColors[task.task_type]}"> </span>
        
        <!-- Task name and description -->
        <span class="font-medium text-gray-800" class:line-through={task.task_completed}>
          {task.task_name} {#if task.task_description} - {task.task_description} {/if}
        </span>
        <!-- Due date -->
        {#if task.task_due_date}
        <span class="text-gray-500 ml-4">Due: {task.task_due_date}</span>
        {/if}
        <!-- Action buttons -->
        <div>
          <!-- Button to toggle task completion -->
          <button
            class="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded shadow-md mr-2"
            on:click={() => toggleComplete(task.id)}
          >
            {task.task_completed ? 'Undo' : 'Complete'}
          </button>
          <!-- Button to edit task -->
          <button
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded shadow-md"
            on:click={() => {
              isEditing = true;
              editTask = task;
            }}
          >
            Edit
          </button>
          <!-- Button to delete task -->
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
