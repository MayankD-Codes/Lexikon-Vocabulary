CREATE OR REPLACE FUNCTION public.enforce_free_word_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid;
  _current_count int;
  _incoming int;
  _limit constant int := 2000;
BEGIN
  SELECT user_id, count(*) INTO _uid, _incoming
    FROM new_rows
    GROUP BY user_id
    LIMIT 1;

  IF _uid IS NULL THEN
    RETURN NULL;
  END IF;

  IF public.is_user_pro(_uid) THEN
    RETURN NULL;
  END IF;

  SELECT count(*) INTO _current_count FROM public.words WHERE user_id = _uid;
  IF _current_count > _limit THEN
    RAISE EXCEPTION
      'Free plan limit reached: you can save up to % words. Upgrade to Lexikon Pro for unlimited words.',
      _limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NULL;
END;
$function$;