<script>
  import { saveChanges } from '$lib/supabaseClient.js';
  export let editTask; // Task object to edit
  console.log(editTask);
  let editedTask = { ...editTask }; // Clone the task object
</script>

<div class="flex flex-col bg-white rounded shadow-md max-w-3xl mx-auto px-20 py-16">
  <h2 class="text-2xl font-bold text-gray-900 mb-8">Edit Task</h2>

  <form on:submit|preventDefault={saveChanges(editedTask)}>
    <div class="flex flex-col space-y-8">
      <div class="flex items-center">
        <label for="task_name" class="w-1/3 text-base text-gray-700 mr-4">Task Name</label>
        <input
          type="text"
          id="task_name"
          bind:value={editedTask.task_name}
          class="flex-grow rounded-md px-4 py-3 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 shadow-sm"
        />
      </div>
      <div class="flex items-center">
        <label for="task_type" class="w-1/3 text-base text-gray-700 mr-4">Task Type</label>
        <select id="task_type" bind:value={editedTask.task_type} class="w-1/4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-gray-900 appearance-none">
          <option value="test" class="py-2 hover:bg-gray-100">Test</option>
          <option value="homework" class="py-2 hover:bg-gray-100">Homework</option>
          <option value="project" class="py-2 hover:bg-gray-100">Project</option>
        </select>
        </div>
      <div class="flex items-center">
        <label for="task_description" class="w-1/3 text-base text-gray-700 mr-4">Task Descripiton</label>
        <input
          type="text"
          id="task_description"
          bind:value={editedTask.task_description}
          class="flex-grow rounded-md px-4 py-3 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 shadow-sm"
        />
      </div>

      <div class="flex justify-end space-x-4">  <button type="submit" class="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-offset-2 focus:ring-indigo-500">
          Save Changes
        </button>
      </div>
    </div>
  </form>
</div>
