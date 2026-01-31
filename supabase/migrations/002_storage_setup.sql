-- Create storage bucket for proof of delivery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-proofs', 'delivery-proofs', false);

-- Storage policies for delivery-proofs bucket
CREATE POLICY "Riders can upload proof images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'delivery-proofs' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Riders can view their uploaded images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'delivery-proofs' 
    AND auth.role() = 'authenticated'
  );

-- Service role can manage all images (for API routes)
CREATE POLICY "Service role full access"
  ON storage.objects FOR ALL
  USING (bucket_id = 'delivery-proofs')
  WITH CHECK (bucket_id = 'delivery-proofs');
