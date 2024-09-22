<script>
    import { addFilter } from '$lib/supabaseClient.js';
    export let uuid; // Task object to edit
    export let addFilters
    let filter_name;
    let filter_color

    function completeAdd(uuid, filter_name, filter_color){
      addFilter(uuid, filter_name, filter_color)
      addFilters=false
    }
  </script>
  
  <div class="flex flex-col bg-white rounded shadow-md max-w-3xl mx-auto px-20 py-16">
    <h2 class="text-2xl font-bold text-gray-900 mb-8">Add Filter</h2>
  
    <form on:submit|preventDefault={completeAdd(uuid, filter_name, filter_color)}>
      <div class="flex flex-col space-y-8">
        <div class="flex items-center">
          <label for="task_name" class="w-1/3 text-base text-gray-700 mr-4">Filter Name</label>
          <input
            type="text"
            id="task_name"
            bind:value={filter_name}
            class="flex-grow rounded-md px-4 py-3 border-black focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 shadow-sm"
          />
        </div>
  
        <div class="flex items-center">
            <label for="task_color" class="w-1/3 text-base text-gray-700 mr-4">Filter Color</label>
            <input
              type="text"
              id="task_color"
              bind:value={filter_color}
              class="flex-grow rounded-md px-4 py-3 border-black focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 shadow-sm"
            />
          </div>
          <div class="flex justify-end space-x-4">  <button type="submit" class="px-6 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-offset-2 focus:ring-indigo-500">
            Save Changes
          </button>
        </div>
      </div>
    </form>
  </div>
  