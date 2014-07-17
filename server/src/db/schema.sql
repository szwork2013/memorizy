CREATE TABLE users (
    id serial primary key,
    name character varying(32) NOT NULL,
    email character varying(64) NOT NULL,
    password character varying(128) NOT NULL,
    enabled boolean DEFAULT false NOT NULL
);

CREATE TABLE users_files (
    user_id integer not null,
    file_id integer NOT NULL,
    percentage integer DEFAULT 0 NOT NULL,
    starred boolean DEFAULT false NOT NULL,
    rest_percentage integer DEFAULT 0 NOT NULL,
    flashcard_order_id integer DEFAULT 1 NOT NULL,
    until_100 boolean DEFAULT false NOT NULL,
    studied integer DEFAULT 0 NOT NULL,
    show_first character varying(32) DEFAULT 'Term'::character varying NOT NULL,
    study_method character varying(32) DEFAULT 'classic'::character varying NOT NULL,
    last_session date,
    next_session date,
    CONSTRAINT users_files_method_check CHECK (((study_method)::text = ANY (ARRAY[('classic'::character varying)::text, ('get100'::character varying)::text]))),
    CONSTRAINT users_files_percentage_check CHECK (((percentage >= 0) AND (percentage <= 100))),
    CONSTRAINT users_files_rest_percentage_check CHECK ((rest_percentage >= 0)),
    CONSTRAINT users_files_show_first_check CHECK (((show_first)::text = ANY (ARRAY[('Term'::character varying)::text, ('Definition'::character varying)::text, ('Random'::character varying)::text, ('Both'::character varying)::text]))),
    CONSTRAINT users_files_studied_check CHECK ((studied >= 0))
);

CREATE TABLE users_flashcards (
    user_id integer NOT NULL,
    flashcard_id integer NOT NULL,
    studied integer DEFAULT 0 NOT NULL,
    status integer DEFAULT 0 NOT NULL,
    CONSTRAINT users_flashcards_status_check CHECK (((status >= (-1)) AND (status <= 3))),
    CONSTRAINT users_flashcards_studied_check CHECK ((studied >= 0))
);


CREATE TABLE files (
    id serial primary key,
    owner_id integer NOT NULL,
    name character varying(64) NOT NULL,
    size integer DEFAULT 0 NOT NULL,
    type character varying(24) NOT NULL,
    symlink_of integer,
    copy_of integer,
    CONSTRAINT files_size_check CHECK ((size >= 0)),
    CONSTRAINT files_type_check CHECK (((type)::text = ANY (ARRAY[('folder'::character varying)::text, ('deck'::character varying)::text])))
);

CREATE TABLE file_tree (
    ancestor_id integer NOT NULL,
    descendant_id integer NOT NULL,
    dist integer NOT NULL,
    CONSTRAINT file_tree_dist_check CHECK ((dist >= 0))
);


CREATE TABLE flashcard_orders (
    id serial primary key,
    flashcard_order character varying(64) NOT NULL
);

CREATE TABLE flashcards (
    id serial primary key,
    owner_id integer NOT NULL,
    deck_id integer NOT NULL,
    term_text character varying(2048) NOT NULL,
    term_media_id integer,
    definition_text character varying(2048) NOT NULL,
    definition_media_id integer,
    index integer NOT NULL,
    term_media_position character varying(24),
    definition_media_position character varying(24),
    CONSTRAINT flashcards_index_check CHECK ((index >= 0))
);


CREATE TABLE media (
    id serial primary key,
    sha256 character(65) NOT NULL,
    links integer DEFAULT 0 NOT NULL,
    CONSTRAINT media_links_check CHECK ((links >= 0))
);

CREATE TABLE media_positions (
    id serial primary key,
    "position" character varying(24) UNIQUE NOT NULL
);

CREATE TABLE study_orders (
    id serial primary key,
    study_order character varying(64) NOT NULL
);

ALTER TABLE ONLY flashcards
ADD CONSTRAINT flashcards_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES files(id) ON DELETE CASCADE;

ALTER TABLE ONLY flashcards
ADD CONSTRAINT flashcards_definition_media_id_fkey FOREIGN KEY (definition_media_id) REFERENCES media(id) ON DELETE SET NULL;

ALTER TABLE ONLY flashcards
ADD CONSTRAINT flashcards_definition_media_position_fkey FOREIGN KEY (definition_media_position) REFERENCES media_positions("position");

ALTER TABLE ONLY flashcards
ADD CONSTRAINT flashcards_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE ONLY flashcards
ADD CONSTRAINT flashcards_term_media_id_fkey FOREIGN KEY (term_media_id) REFERENCES media(id) ON DELETE SET NULL;

ALTER TABLE ONLY flashcards
ADD CONSTRAINT flashcards_term_media_position_fkey FOREIGN KEY (term_media_position) REFERENCES media_positions("position");

ALTER TABLE ONLY file_tree
ADD CONSTRAINT file_tree_ancestor_id_fkey FOREIGN KEY (ancestor_id) REFERENCES files(id) ON DELETE CASCADE;

ALTER TABLE ONLY file_tree
ADD CONSTRAINT file_tree_descendant_id_fkey FOREIGN KEY (descendant_id) REFERENCES files(id) ON DELETE CASCADE;

ALTER TABLE ONLY files
ADD CONSTRAINT files_copy_of_fkey FOREIGN KEY (copy_of) REFERENCES files(id);

ALTER TABLE ONLY files
ADD CONSTRAINT files_ownerid_fkey FOREIGN KEY (owner_id) REFERENCES users(id);

ALTER TABLE ONLY files
ADD CONSTRAINT files_symlink_of_fkey FOREIGN KEY (symlink_of) REFERENCES files(id);

ALTER TABLE ONLY users_flashcards
    ADD CONSTRAINT users_flashcards_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY users_files
    ADD CONSTRAINT users_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY users_files
    ADD CONSTRAINT users_files_file_id_fkey FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE;
ALTER TABLE ONLY users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY users_files
    ADD CONSTRAINT users_files_pkey PRIMARY KEY (user_id, file_id);

ALTER TABLE ONLY users_flashcards
    ADD CONSTRAINT users_flashcards_pkey PRIMARY KEY (user_id, flashcard_id);

ALTER TABLE ONLY users
    ADD CONSTRAINT users_username_key UNIQUE (name);

ALTER TABLE ONLY users_files
    ADD CONSTRAINT users_files_flashcard_order_id_fkey FOREIGN KEY (flashcard_order_id) REFERENCES flashcard_orders(id) ON DELETE SET DEFAULT;

ALTER TABLE ONLY users_flashcards
    ADD CONSTRAINT users_flashcards_flashcard_id_fkey FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE;


--
-- Name: users_flashcards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--
