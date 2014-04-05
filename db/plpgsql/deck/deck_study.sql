create or replace 
function update_flashcard_status (_user_id integer, 
                                  _flashcard_id integer, 
                                  _last_state char) 
returns void as $$
declare
	state_histories	record;
begin
	select update_flashcard_state_history( 
		user_id, 
		flashcard_id, 
		quote_literal(last_state) 
  ) 
  into state_histories;

	perform update_file_status(user_id, tmp_status.deck_id, 
		(select percentage from state_hist_to_percentage where state_hist = state_histories.new) -
		(select percentage from state_hist_to_percentage where state_hist = state_histories.old));
end;
$$ language plpgsql;

