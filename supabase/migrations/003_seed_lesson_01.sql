-- Seed the reusable lesson required by notes, progress, and retell foreign keys.

insert into public.lessons (
  id, order_no, title, subtitle, duration_seconds, audio_url, status, published
)
values (
  'lesson-01', 1, 'How to Express Your Opinion', '表达观点与回应',
  435, '/audio/lesson-01.mp3', 'completed', true
)
on conflict (id) do update set
  order_no = excluded.order_no,
  title = excluded.title,
  subtitle = excluded.subtitle,
  duration_seconds = excluded.duration_seconds,
  audio_url = excluded.audio_url,
  status = excluded.status,
  published = excluded.published;

insert into public.lesson_segments (
  id, lesson_id, order_no, english_text, chinese_text,
  start_seconds, end_seconds, keywords
)
values
  (
    'segment-01', 'lesson-01', 1,
    'Suppose you are with a group of friends discussing the greatest inventions of the twentieth century.',
    '假设你正在和朋友讨论二十世纪最伟大的发明。',
    0, 82, array['suppose', 'discuss', 'inventions']
  ),
  (
    'segment-02', 'lesson-01', 2,
    'One friend says that the computer was the best invention.',
    '一位朋友认为电脑是最伟大的发明。',
    82, 164, array['computer', 'best invention']
  ),
  (
    'segment-03', 'lesson-01', 3,
    'Another friend disagrees and points out that airplanes also changed the world.',
    '另一位朋友不同意，并指出飞机也改变了世界。',
    164, 250, array['disagree', 'airplanes', 'changed']
  ),
  (
    'segment-04', 'lesson-01', 4,
    'You can respond politely by acknowledging the other opinion before explaining your reason.',
    '你可以先认可对方的观点，再解释自己的理由。',
    250, 340, array['respond politely', 'acknowledge', 'reason']
  ),
  (
    'segment-05', 'lesson-01', 5,
    'Useful phrases include I think, I believe, in my opinion, and I would say.',
    '常用表达包括我认为、我相信、在我看来以及我会说。',
    340, 435, array['I think', 'I believe', 'in my opinion']
  )
on conflict (id) do update set
  lesson_id = excluded.lesson_id,
  order_no = excluded.order_no,
  english_text = excluded.english_text,
  chinese_text = excluded.chinese_text,
  start_seconds = excluded.start_seconds,
  end_seconds = excluded.end_seconds,
  keywords = excluded.keywords;
