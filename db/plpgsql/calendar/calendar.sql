create or replace function count_flashcards_to_study (_user_id integer) returns integer as $$
declare _count integer;
begin
  select sum(size) into _count
  from users_files uf
  join files f on uf.file_id = f.id
  where uf.user_id = _user_id 
  and f.type = 'deck'
  and next_session <= CURRENT_DATE;

  return _count;
end;
$$ language plpgsql;

create or replace function get_calendar (_user_id integer) 
returns table (file_id integer, file_name varchar, last_session date, next_session date, size integer) as $$
begin
  return query 
    select 
      f.id as file_id,
      f.name as filename,
      uf.last_session,
      (
        case 
          when uf.next_session < CURRENT_DATE then CURRENT_DATE
          else uf.next_session
        end
      ) as next_session,
      f.size 
    from files f 
      join users_files uf on f.id = uf.file_id 
    where uf.user_id = _user_id
    and f.type = 'deck'
    and uf.next_session is not null
    order by next_session asc, size desc;
end;
$$ language plpgsql;

create or replace function get_decks (_user_id integer, _date date)
returns table(id integer, owner_id integer, deck_id integer,
              term_text text, term_media_id integer, term_media_position integer, 
              definition_text text, definition_media_id integer,
              definition_media_position integer, index integer, status integer,
              studied integer)
as $$
begin
  return query
    with decks as (
      select * from files f
      where exists (
        select 1 from users_files uf
        where uf.file_id = f.id
        and uf.next_session <= CURRENT_DATE
        and uf.user_id = _user_id
      ) 
      and f.type = 'deck'
    )
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
    from flashcards f 
      left join users_flashcards uf on f.id = uf.flashcard_id 
      join users_files ufl on f.deck_id = ufl.file_id
    where f.deck_id in (
      select d.id from decks d
    )
    order by ufl.next_session asc, f.deck_id asc, f.index asc;
end;
$$ language plpgsql;
