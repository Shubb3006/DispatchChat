import { fetchAndFormatSupabaseLoad } from "../lib/supabaseLoad.js";

const test = async () => {
  const result = await fetchAndFormatSupabaseLoad("10006");
  console.log("=== LOAD FORMATTER OUTPUT ===");
  if (result) {
    console.log(result.formattedTemplate);
  } else {
    console.log("Load not found");
  }
  process.exit(0);
};

test();
