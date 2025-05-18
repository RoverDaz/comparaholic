/*
  # Add set_claim_tag function

  1. New Functions
    - `set_claim_tag(key text, value text)`
      - Sets a configuration value for the current session
      - Parameters:
        - key: The configuration key to set
        - value: The value to set for the key
      - Returns: void
      - Security: SECURITY DEFINER to allow any user to call it
      
  2. Security
    - Function is marked as SECURITY DEFINER to allow public access
    - Only allows setting specific claim keys for security
*/

create or replace function public.set_claim_tag(key text, value text)
returns void
language plpgsql
security definer
as $$
begin
  -- Only allow setting specific claim keys for security
  if key not in ('visitor.id') then
    raise exception 'Invalid claim key';
  end if;
  
  -- Set the configuration value
  perform set_config(key, value, false);
end;
$$;