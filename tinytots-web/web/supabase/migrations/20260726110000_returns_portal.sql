ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS order_item_ids bigint[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS photo_url text;

ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
ALTER TABLE public.complaints ADD CONSTRAINT complaints_status_check
  CHECK (status = ANY (ARRAY[
    'open', 'in_progress', 'resolved',
    'approved', 'rejected', 'refunded', 'exchanged'
  ]));

INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-photos', 'complaint-photos', true)
ON CONFLICT (id) DO NOTHING;
