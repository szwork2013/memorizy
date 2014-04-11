create or replace
function get_flashcards (_user_id integer, _file_id integer, _order_id integer)
returns table(id integer, owner_id integer, deck_id integer,
              term_text text, term_media_id integer, term_media_position integer, 
              definition_text text, definition_media_id integer,
              definition_media_position integer, index integer, state_history text,
              studied integer)
as $$
-- TODO return flashcards of all file's decks if the file
-- provided as arguments isn't a deck
begin
  create temp table t (
    id integer, owner_id integer, deck_id integer,
    term_text text, term_media_id integer, term_media_position integer, 
    definition_text text, definition_media_id integer,
    definition_media_position integer, index integer, state_history text,
    studied integer
  ) on commit drop;

  insert into t
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
      '11111'    
    )::TEXT state_history,
    coalesce(uf.studied, 0)::INTEGER
  from   
    flashcards f left join users_flashcards uf 
    on f.id = uf.flashcard_id 
    and _user_id = uf.user_id   
  where f.deck_id in (
    select ft.descendant_id
    from file_tree ft
    where ft.ancestor_id = _file_id
  );

  case 
    when _order_id = 1 then -- Classic
      return query 
        select * from t;
    when _order_id =  2 then -- Hardest to easiest
      return query 
        select * from t 
        order by state_history desc;
    when _order_id =  3 then -- Least studied
      return query 
        select * from t 
        order by studied asc; 
    when _order_id =  4 then -- Wrongs
      return query 
        select * from t
        where left(t.state_history, 3) <> '000'
        order by t.index asc;
    else 
      raise invalid_parameter_value 
      using message = 'Unknown order id';
  end case;

end;
$$ language plpgsql;


