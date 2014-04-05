create or replace
function get_flashcards (_user_id integer, _file_id integer)
returns table(id integer, owner_id integer, deck_id integer,
              term_text text, term_media_id integer, term_media_position integer, 
              definition_text text, definition_media_id integer,
              definition_media_position integer, index integer, state_history text)
as $$
-- TODO return flashcards of all file's decks if the file
-- provided as arguments isn't a deck
begin
  return query
    select    
      f.id,   
      f.owner_id,   
      f.deck_id,   
      f.term_text::TEXT,   
      f.term_media_id::INTEGER,   
      f.term_media_position::INTEGER,   
      f.definition_text::TEXT,   
      f.definition_media_id::INTEGER,   
      f.definition_media_position::INTEGER,   
      f.index,   
      coalesce(   
        uf.state_history,    
        '00000'    
      )::TEXT   
    from   
      flashcards f left join users_flashcards uf 
      on f.id = uf.flashcard_id 
      and _user_id = uf.user_id   
    where f.deck_id in (
      select ft.descendant_id
      from file_tree ft
      where ft.ancestor_id = _file_id
    )
    order by   
      f.index asc ;
end;
$$ language plpgsql;


