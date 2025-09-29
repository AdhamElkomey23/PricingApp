import ItineraryInputForm from '../ItineraryInputForm';
import type { ItineraryInput } from '@shared/schema';

export default function ItineraryInputFormExample() {
  const handleSubmit = (data: ItineraryInput) => {
    console.log('Example form submitted:', data);
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <ItineraryInputForm onSubmit={handleSubmit} />
    </div>
  );
}