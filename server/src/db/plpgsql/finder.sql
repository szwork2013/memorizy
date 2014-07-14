create or replace function find (_user_id integer, _keywords text[]) returns 
table (id integer, name text, type text, path text) as $$ 
begin
  return query
    select 
      f.id::INTEGER,
      f.name::TEXT,
      f.type::TEXT,
      get_path(f.id)::TEXT path
    from files f
    where match(f.name, _keywords) is true;
end;
$$ language plpgsql;

create or replace function match (_str text, _keywords text[]) returns boolean as $$
declare 
  _i     integer;
  _size  integer;
  _lower_str text;
  _query text;
  _match boolean;
begin
  if array_length(_keywords, 1) = 0 then 
    return false;
  end if;

  select lower(_str) into _lower_str;

  _i := 2;
  _size := array_length(_keywords, 1);

  _query := 'select ' || quote_literal(_lower_str) || ' like ' 
            || quote_literal('%' || lower(_keywords[1]) || '%') ;
  while _i <= _size loop
    _query := _query || ' and ' || quote_literal(_lower_str) || ' like ' 
              || quote_literal('%' || lower(_keywords[_i]) || '%') ;
    _i := _i + 1;
  end loop;

  execute _query into _match;

  return _match;
end;
$$ language plpgsql;
