<script>
  import { addFilter } from '$lib/supabaseClient.js';
  export let uuid;
  export let addFilters;
  let filter_name = "";
  let filter_color = "";

  function completeAdd() {
    if (filter_name.trim()) {
      addFilters = false;
      addFilter(uuid, filter_name, filter_color);
    }
  }
</script>

<div class="max-w-md mx-auto p-6 bg-gray-100 rounded-2xl shadow-lg">
  <h2 class="text-center text-lg font-semibold text-gray-900 mb-4">Add Filter</h2>
  <form on:submit|preventDefault={completeAdd}>
    <div class="mb-4">
      <label for="filter_name" class="block text-sm text-gray-700">Filter Name</label>
      <input type="text" id="filter_name" bind:value={filter_name} placeholder="Enter filter name" 
        class="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
    </div>

    <div class="mb-4">
      <label for="filter_color" class="block text-sm text-gray-700">Filter Color</label>
      <input type="text" id="filter_color" bind:value={filter_color} placeholder="Enter filter color" 
        class="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
    </div>

    <button type="submit" 
      class="w-full py-2 text-white font-semibold bg-blue-600 rounded-lg hover:bg-blue-700 transition-all">
      Save
    </button>
  </form>
</div>
