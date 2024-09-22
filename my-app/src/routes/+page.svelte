<script>
  import { onMount } from 'svelte';
  import { delTaskFilter, fetchTasks, getFilterColor, fetchFilters, sendTask, delTask, updateTaskCompletion } from '$lib/supabaseClient.js';
  import Edit from '$lib/components/Edit.svelte';
  import AddFilter from '$lib/components/AddFilter.svelte';

  let uuid;
  let isEditing = false;
  let editTask = null;
  let filter = "all";
  let activeFilter = "all";
  let taskTypeColors = {}; // Dictionary to store task type colors
  let sortOption = 'none'; // Default to 'none' for no sorting

  let originalTasks = [];
  let tasks = [];
  let newTask = "";
  let newTaskType = "test";
  let newTaskDescription = "";
  let newTaskDueDate = null;
  let newTaskPoints = 0;

  let originalFilters = [];
  let filters = [];
  let addFilters = false;

  let isDarkMode = false; // State for dark mode toggle
  
  // Add this function to toggle dark mode
  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark', isDarkMode); // Toggle 'dark' class on the HTML element
  }

  // Filter and sort logic
  $: filteredTasks = activeFilter === "all"
    ? tasks.filter(task => !task.task_completed)
    : activeFilter === "completed"
      ? tasks.filter(task => task.task_completed)
      : tasks.filter(task => task.task_type === activeFilter.filter_name && !task.task_completed);

  $: sortedTasks = sortOption === 'none' 
    ? filteredTasks // If 'none', do not sort and keep the filtered list as is
    : filteredTasks.sort((a, b) => {
      switch (sortOption) {
        case 'dueDate':
          return new Date(a.task_due_date) - new Date(b.task_due_date);
        case 'filter':
          return a.task_type.localeCompare(b.task_type);
        case 'alphabetical':
        default:
          return a.task_name.localeCompare(b.task_name);
      }
    });

  async function getIPAddress() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      uuid = data.ip;
      return uuid;
    } catch (error) {
      console.error('Error fetching IP address:', error);
    }
  }

  async function updateTaskTypeColors() {
    const promises = tasks.map(async task => {
      if (!taskTypeColors[task.task_type]) {
        const color = await getFilterColor(task.task_type, uuid);
        taskTypeColors[task.task_type] = color || 'gray'; // Default to 'gray' if no color is found
      }
    });
    await Promise.all(promises);
  }
  $: fetchTasks(uuid).then(data => {
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
        task_completed: false,
        task_points: newTaskPoints
      };
      tasks = [...tasks, task];
      originalTasks = [...originalTasks, task];
      newTask = "";
      newTaskDescription = "";
      newTaskDueDate = null;
      newTaskPoints = null;
      await sendTask(task.task_name, task.task_type, task.task_description, task.task_due_date, task.task_completed, uuid, task.task_points);
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

  function deleteTaskFilter(uuid, filterName) {
    delTaskFilter(uuid, filterName);
    fetchFilters(uuid).then(data => {
      if (data) {
        filters = data;
        filters = data.slice();
        if (!filters.includes(newTaskType)) {
          newTaskType = filters[0];
        }
      }
    });
  }

  function handleMouseEnter(filter) {
    filter.hoverTimeout = setTimeout(() => {
      filter.showDeleteButton = true;
    }, 100);
  }

  function handleMouseLeave(filter) {
    clearTimeout(filter.hoverTimeout);
    filter.showDeleteButton = false;
  }

  function multipledel(uuid, filter_name) {
    deleteTaskFilter(uuid, filter_name);
    deleteTaskFilter(uuid, filter_name);
  }
</script>
<div class="flex h-screen bg-gray-50">
  <!-- Sidebar -->
  {#if isEditing}
  <div class="z-20 fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <button class="z-10 fixed flex h-screen w-screen items-center justify-center"
		on:click={() => {
      isEditing=false
		}}>
    <div on:click|stopPropagation class="bg-white rounded-xl shadow-lg p-6">
      <Edit {editTask} bind:isEditing={isEditing}/>
    </div>
  </div>
  {/if}
  {#if addFilters}
  <div class="z-20 fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <button class="z-10 fixed flex h-screen w-screen items-center justify-center"
		on:click={() => {
      addFilters=false
		}}>
    <div on:click|stopPropagation class="bg-white rounded-xl shadow-lg p-6">
      <AddFilter {uuid} bind:addFilters={addFilters}/>
    </div>
  </div>
  {/if}

  <!-- Sidebar -->
  <div class="w-64 bg-white shadow-xl rounded-lg p-4">
    <h1 class="text-2xl font-semibold text-gray-900 mb-6">Tasks</h1>
    <button class="bg-black text-white w-full px-4 py-2 rounded-lg transition duration-300 ease-in-out hover:bg-white hover:text-black border border-black" on:click={() => addFilters=true}

    >
      Add Filter
    </button>

    <label class="block text-sm font-medium text-gray-700 mt-4 mb-1">Filter</label>
    <div class="space-y-2">
      <button 
        class="{activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} w-full px-4 py-2 rounded-lg transition duration-300 ease-in-out hover:bg-gray-200"
        on:click={() => activeFilter = 'all'}
      >
        All
      </button>

      {#each filters as filter}
        <div class="relative">
          <button
            class="w-full px-4 py-2 rounded-lg transition duration-300 ease-in-out hover:bg-gray-200"
            style="background-color: {taskTypeColors[filter.filter_name] || '#f3f4f6'}; color: {filter === activeFilter ? 'white' : 'black'}"
            on:click={() => activeFilter = filter}
          >
            {filter.filter_name}
          </button>
          {#if filter == activeFilter}
          <button 
            class="absolute right-2 top-2 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full transition duration-300 ease-in-out hover:bg-red-800"
            on:click={() => multipledel(filter.uuid, filter.filter_name)}
          >
            x
          </button>
          {/if}
        </div>
      {/each}

      <hr class="my-4 border-gray-300">

      <button 
        class="{activeFilter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} w-full px-4 py-2 rounded-lg transition duration-300 ease-in-out hover:bg-gray-200"
        on:click={() => activeFilter = 'completed'}
      >
        Completed
      </button>
    </div>
  </div>
  <!-- Main Content Area -->
  <div class="flex-1 overflow-y-auto p-8 bg-gray-50">
    <div class="flex items-center mb-6 space-x-4">
      <input
        class="border border-gray-200 bg-gray-50 h-12 px-5 pr-16 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition duration-200 flex-1"
        type="text"
        placeholder="Add a task"
        bind:value={newTask}
        on:keydown={(e) => e.key === 'Enter' && addTask()}
      />
      <button
        class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-full shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
        on:click={addTask}
      >
        Add
      </button>
      <label class="text-sm font-medium text-gray-700">Sort by:</label>
      <select bind:value={sortOption} class="ml-2 border-gray-300 rounded-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm transition duration-200">
        <option value="none">None</option> <!-- Added "None" option -->
        <option value="alphabetical">Alphabetical</option>
        <option value="dueDate">Due Date</option>
        <option value="filter">Task Type</option>
      </select>
    </div>
    
    <div class="flex items-center mb-6 space-x-4">
          
      <label class="text-sm font-medium text-gray-700 ml-8">Task Type</label>
      <select bind:value={newTaskType} class="w-1/4 px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white shadow-sm transition duration-200 text-gray-900">
        {#each filters as filter}
          <option value={filter} class="py-2 hover:bg-gray-100">{filter.filter_name}</option>
        {/each}
      </select>
    
      <label class="text-sm font-medium text-gray-700 ml-8">Task Due Date</label>
      <input class="w-1/4 px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 shadow-sm transition duration-200" type="text" bind:value={newTaskDueDate} placeholder="Enter Due Date" />
      
      <label class="text-sm font-medium text-gray-700 ml-8">Task Description</label>
      <input class="w-1/4 px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 shadow-sm transition duration-200" type="text" bind:value={newTaskDescription} placeholder="Enter Description" />
      
      <label class="text-sm font-medium text-gray-700 ml-8">Task Points</label>
      <input type="number" class="w-1/4 px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 shadow-sm transition duration-200" bind:value={newTaskPoints} placeholder="Enter Task Points" />
    </div>
        <ul class="space-y-4">
          {#each filteredTasks as task, index (index)}
          <li 
            class="flex justify-between items-center bg-white p-4 rounded-lg shadow-lg mb-4 transition duration-300 ease-in-out hover:shadow-xl" 
            draggable="true" 
            on:dragstart={() => dragStart(index)} 
            on:dragover={(e) => dragOver(e)} 
            on:drop={() => drop(index)}
          >
            <!-- Colored indicator based on task type -->
            <span class="w-4 h-4 mr-3 rounded-full block" style="background-color: {taskTypeColors[task.task_type]}"></span>
            
            <!-- Task name, description, and points -->
            <div class="flex-1">
              <span class="font-bold text-gray-900 block">{task.task_name} {#if task.task_points} ({task.task_points} pts) {/if}</span>
              <span class="text-sm text-gray-600 block">{task.task_description}</span>
            </div>
        
            <!-- Due date -->
            {#if task.task_due_date}
              <span class="text-gray-500 ml-4 text-sm mr-6">Due: {task.task_due_date}</span>
            {/if}
        
            <!-- Action buttons -->
            <div class="flex items-center space-x-2">
              <button 
                class="bg-green-500 hover:bg-green-600 active:scale-95 text-white font-medium py-1 px-3 rounded-lg shadow-md transition duration-300 ease-in-out"
                on:click={() => toggleComplete(task.id)}
              >
                {task.task_completed ? 'Undo' : 'Complete'}
              </button>
        
              <button 
                class="bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-medium py-1 px-3 rounded-lg shadow-md transition duration-300 ease-in-out"
                on:click={() => { isEditing = true; editTask = task; }}
              >
                Edit
              </button>
        
              <button 
                class="bg-red-500 hover:bg-red-600 active:scale-95 text-white font-medium py-1 px-3 rounded-lg shadow-md transition duration-300 ease-in-out"
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
