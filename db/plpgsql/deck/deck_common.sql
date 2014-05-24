create or replace
function get_flashcards (_user_id integer, _file_id integer, _order_id integer)
returns table(id integer, owner_id integer, deck_id integer,
              term_text text, term_media_id integer, term_media_position integer, 
              definition_text text, definition_media_id integer,
              definition_media_position integer, index integer, status integer,
              studied integer)
as $$
begin
  create temp table t (
    id integer, owner_id integer, deck_id integer,
    term_text text, term_media_id integer, term_media_position integer, 
    definition_text text, definition_media_id integer,
    definition_media_position integer, index integer, status integer,
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
    coalesce(uf.status, 0)::INTEGER status,
    coalesce(uf.studied, 0)::INTEGER
  from   
    flashcards f left join users_flashcards uf 
    on f.id = uf.flashcard_id 
    and _user_id = uf.user_id   
  where f.deck_id = _file_id;

  if _order_id is null then
    select coalesce(flashcard_order_id, 1) 
    into _order_id
    from users_files
    where file_id = _file_id
    and user_id = _user_id;
  end if;

  case 
    when _order_id = 1 then -- Classic
      return query 
        select * from t
        order by index asc;
    when _order_id =  2 then -- Hardest to easiest
      return query 
        select * from t 
        order by status asc, index asc;
    when _order_id =  3 then -- Least studied
      return query 
        select * from t 
        order by studied asc, index asc; 
    when _order_id =  4 then -- Wrongs
      return query 
        select * from t
        where status = -1
        order by t.index asc;
    else 
      raise invalid_parameter_value 
      using message = 'Unknown order id';
  end case;

end;
$$ language plpgsql;


