import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jpvlrbkbbyeywyvxpaiq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwdmxyYmtiYnlleXd5dnhwYWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk1NjI2NzgsImV4cCI6MjAxNTEzODY3OH0.ihWisJ0_Ys6U0bdoOeQxKmw4OL5YTdL0nns-tGrT5vE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function sendTask(task, taskType, taskDescription, taskDueDate, task_completed, uuid) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        { 
          task_name: task, 
          task_type: taskType, 
          task_description: taskDescription,
          task_due_date: taskDueDate,
          task_completed: task_completed,
          uuid: uuid 
        }
      ])
  
    if (error) console.error('Error sending task:', error)
    else return data
  }

  export async function fetchTasks(uuid) {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('uuid', uuid);

        if (error) {
            console.error('Error fetching tasks:', error);
            return null; // Return null if there's an error
        } else {
            return data; // Return data if fetched successfully
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return null; // Return null in case of any unexpected errors
    }
}

export async function delTask(id) {
  let { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

  if (error) {
      console.error('Error deleting task:', error);
      return null;
  }

  return data;
}

export async function updateTaskCompletion(task_id, task_completed) {
  try {
      const { data, error } = await supabase
          .from('tasks')
          .update({ task_completed: task_completed })
          .eq('id', task_id);

      if (error) {
          console.error('Error updating task completion:', error);
          return null; // Return null if there's an error
      } else {
          console.log(data);
          return data; // Return updated data if successful
      }
  } catch (error) {
      console.error('Error updating task completion:', error);
      return null; // Return null in case of any unexpected errors
  }
}

export async function saveChanges(editedTask) {
    const { data, error } = await supabase
      .from('tasks')
      .update(editedTask)
      .match({ id: editedTask.id });

    if (error) {
      console.error('Error updating task:', error.message);
    } else {
      console.log('Task updated successfully:', data);
    }
  }

export async function addFilter(uuid, filter_name, filter_color) {
  const { data, error } = await supabase
    .from('tasks_filters')
    .insert([
      { 
        uuid: uuid,
        filter_name: filter_name,
        filter_color: filter_color
      }
    ])

  if (error) console.error('Error sending task:', error)
  else return data
}

export async function fetchFilters(uuid) {
  try {
      const { data, error } = await supabase
          .from('tasks_filters')
          .select('*')
          .eq('uuid', uuid);

      if (error) {
          console.error('Error fetching tasks:', error);
          return null; // Return null if there's an error
      } else {
          return data; // Return data if fetched successfully
      }
  } catch (error) {
      console.error('Error fetching tasks:', error);
      return null; // Return null in case of any unexpected errors
  }
}

export async function getFilterColor(filterName, uuid) {
  try {
      const { data, error } = await supabase
          .from('tasks_filters')
          .select('filter_color')
          .eq('filter_name', filterName)
          .eq('uuid', uuid)
          .single(); // Assuming each filter_name is unique

      if (error) {
          console.error('Error fetching filter color:', error);
          return null; // Return null if there's an error
      } else if (data) {
          return data.filter_color; // Return filter_color if found
      } else {
          console.error('Filter not found:', filterName);
          return null; // Return null if filter not found
      }
  } catch (error) {
      console.error('Error fetching filter color:', error);
      return null; // Return null in case of any unexpected errors
  }
}

export async function delTaskFilter(uuid, filter_name) {
  let { data, error } = await supabase
      .from('tasks_filters')
      .delete()
      .eq('uuid', uuid)
      .eq('filter_name', filter_name);

  if (error) {
      console.error('Error deleting task filter:', error.message);
      return null;
  }

  return data;
}