import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jpvlrbkbbyeywyvxpaiq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwdmxyYmtiYnlleXd5dnhwYWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk1NjI2NzgsImV4cCI6MjAxNTEzODY3OH0.ihWisJ0_Ys6U0bdoOeQxKmw4OL5YTdL0nns-tGrT5vE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function sendTask(task, taskType, uuid) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        { 
          task_name: task, 
          task_type: taskType, 
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
            console.log(data)
            return data; // Return data if fetched successfully
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return null; // Return null in case of any unexpected errors
    }
}
