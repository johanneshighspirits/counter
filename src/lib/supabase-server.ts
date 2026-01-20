import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const getSupabaseServerClient = () => {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Missing Supabase configuration');
  }
  const supabase = createClient(supabaseUrl, supabasePublishableKey);
  return supabase;
};

export async function getProjectScopedServerClient(projectSlug: string) {
  const supabase = getSupabaseServerClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id,name')
    .eq('slug', projectSlug)
    .single();

  if (!project) throw new Error('Project not found');

  // await setProjectContext(supabase, project.id);

  return { supabase, project };
}

export async function setProjectContext(
  supabase: SupabaseClient,
  projectId: string,
) {
  const { error } = await supabase.rpc('set_config', {
    key: 'request.project_id',
    value: projectId,
    is_local: true, // important
  });

  if (error) {
    throw error;
  }
}
