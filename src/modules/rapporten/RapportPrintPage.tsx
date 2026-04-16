
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const RapportPrintPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect back to detail page because we now use PDF blob generation there
    if (id) {
        navigate(`/rapporten/${id}`);
    } else {
        navigate('/rapporten');
    }
  }, [id, navigate]);

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center p-8 text-center font-mono">
      <div className="max-w-md">
          <h1 className="text-xl font-bold mb-4 text-apex-gold">Print View Deprecated</h1>
          <p className="text-zinc-400">
              U wordt doorgestuurd naar de rapport detailpagina. Gebruik daar de knoppen "Download PDF" of "Afdrukken".
          </p>
      </div>
    </div>
  );
};
