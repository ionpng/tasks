<script>
  import { onMount } from 'svelte';
  import { delTaskFilter, fetchTasks, getFilterColor, fetchFilters, sendTask, delTask, updateTaskCompletion } from '$lib/supabaseClient.js';
  import Edit from '$lib/components/Edit.svelte';
  import AddFilter from '$lib/components/AddFilter.svelte';
  import {SunIcon, MoonIcon, MenuIcon} from "svelte-feather-icons";
  import { ModeWatcher } from "mode-watcher";

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
  let newTaskPoints = null;

  let originalFilters = [];
  let filters = [];
  let addFilters = false;

  
  let isMobile = false;
  let sidebarOpen = false;

  const checkIfMobile = () => {
        isMobile = window.innerWidth <= 768;
    };

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen
  }
  // Run on component mount
  onMount(() => {
      checkIfMobile();
  });

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
<div class="flex h-screen w-full">
  <!-- Sidebar -->
  {#if !isMobile}
  <div class="w-[22vw] min-w-[300px] bg-white dark:bg-black text-black dark:text-white shadow-2xl rounded-3xl p-6 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
    <h1 class="text-3xl font-semibold text-center mb-6">Tasks</h1>

    <!-- Add Filter Button -->
    <button 
      class="w-full px-4 py-3 rounded-2xl shadow-lg transition duration-300 ease-in-out bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
      on:click={() => addFilters = true}
    >
      Add Filter
    </button>

    <!-- Filters -->
    <div class="mt-6 space-y-3">
      <label class="text-lg font-medium text-gray-700 dark:text-gray-300">Filters</label>
      
      <button 
        class="w-full px-4 py-2 rounded-xl transition duration-300 ease-in-out
          {activeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}
          hover:bg-gray-300 dark:hover:bg-gray-700"
        on:click={() => activeFilter = 'all'}
      >
        All
      </button>

      {#each filters as filter}
        <div class="relative">
          <button
            class="w-full px-4 py-2 rounded-xl transition duration-300 ease-in-out"
            style="background-color: {taskTypeColors[filter.filter_name] || '#f3f4f6'}; color: {filter === activeFilter ? 'white' : 'black'}"
            on:click={() => activeFilter = filter}
          >
            {filter.filter_name}
          </button>
          {#if filter == activeFilter}
          <button 
            class="absolute right-2 top-2 bg-red-500 text-white w-6 h-6 flex items-center justify-center rounded-full transition duration-300 ease-in-out hover:bg-red-700"
            on:click={() => multipledel(filter.uuid, filter.filter_name)}
          >
            ×
          </button>
          {/if}
        </div>
      {/each}
      
      <hr class="my-4 border-gray-300">

      <button 
        class="w-full px-4 py-2 rounded-xl transition duration-300 ease-in-out
          {activeFilter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}
          hover:bg-gray-300 dark:hover:bg-gray-700"
        on:click={() => activeFilter = 'completed'}
      >
        Completed
      </button>
    </div>
    <div class="fixed bottom-4 left-4">
          <SunIcon></SunIcon>
    </div>    
  </div>
  {/if}

  <!-- Main Content -->
  <div class="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-black transition-all">
    <div class="flex items-center justify-between mb-6">
      {#if isMobile}
      <button class="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center" on:click={() => toggleSidebar()}>
        <MenuIcon></MenuIcon>
      </button>
      {/if}

      <!-- Sorting -->
      <div class="flex items-center space-x-4">
        <label class="text-lg font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
        <select bind:value={sortOption} class="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white">
          <option value="none">None</option>
          <option value="alphabetical">Alphabetical</option>
          <option value="dueDate">Due Date</option>
          <option value="filter">Task Type</option>
        </select>
      </div>
    </div>

  <!-- Add Task -->
  <div class="flex items-center space-x-4 mb-6">
    <input
      class="flex-1 px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
      type="text"
      placeholder="Add a task"
      bind:value={newTask}
      on:keydown={(e) => e.key === 'Enter' && addTask()}
    />

  <!-- Task Type Selector -->
    <select 
      bind:value={newTaskType} 
      class="px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white"
    >
      {#each filters as filter}
        <option value={filter.filter_name}>{filter.filter_name}</option>
      {/each}
    </select>

    <button 
      class="px-5 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-transform transform active:scale-95"
      on:click={addTask}
    >
      Add
    </button>
</div>
    <!-- Task List -->
    <ul class="space-y-4">
      {#each filteredTasks as task, index (index)}
      <li 
        class="flex items-center justify-between p-4 rounded-2xl shadow-md bg-white dark:bg-gray-900 transition-all"
        draggable="true" 
        on:dragstart={() => dragStart(index)} 
        on:dragover={(e) => dragOver(e)} 
        on:drop={() => drop(index)}
      >
        <span class="w-4 h-4 mr-3 rounded-full block" style="background-color: {taskTypeColors[task.task_type]}"></span>

        <div class="flex-1">
          <span class="font-semibold text-gray-900 dark:text-white">{task.task_name} {#if task.task_points} ({task.task_points} pts) {/if}</span>
          <span class="block text-sm text-gray-600 dark:text-gray-400">{task.task_description}</span>
        </div>

        {#if task.task_due_date}
          <span class="text-gray-500 dark:text-gray-400 text-sm mr-6">Due: {task.task_due_date}</span>
        {/if}

        <div class="flex space-x-2">
          <button 
            class="bg-green-500 px-4 py-2 rounded-xl text-white shadow-md transition-transform transform active:scale-95 hover:bg-green-600"
            on:click={() => toggleComplete(task.id)}
          >
            {task.task_completed ? 'Undo' : 'Complete'}
          </button>

          <button 
            class="bg-blue-500 px-4 py-2 rounded-xl text-white shadow-md transition-transform transform active:scale-95 hover:bg-blue-600"
            on:click={() => { isEditing = true; editTask = task; }}
          >
            Edit
          </button>

          <button 
            class="bg-red-500 px-4 py-2 rounded-xl text-white shadow-md transition-transform transform active:scale-95 hover:bg-red-600"
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
