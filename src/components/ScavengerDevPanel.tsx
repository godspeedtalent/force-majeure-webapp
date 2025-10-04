import { useState } from 'react';
import { Button } from './ui/button';
import { Code, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ScavengerDevPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const testScenarios = [
    {
      name: 'Invalid Token',
      token: 'INVALID_TOKEN_123',
      description: 'Token that does not exist in database'
    },
    {
      name: 'Already Claimed',
      token: 'ALREADY_CLAIMED_TOKEN',
      description: 'Valid token but already claimed by this user/device'
    },
    {
      name: 'Valid Unclaimed',
      token: 'VALID_UNCLAIMED_TOKEN',
      description: 'Valid token ready to claim'
    },
    {
      name: 'No Token',
      token: null,
      description: 'Navigate without a token'
    }
  ];

  const handleScenario = (token: string | null) => {
    if (token) {
      navigate(`/scavenger-leaderboard?token=${token}`);
    } else {
      navigate('/scavenger-leaderboard');
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-fm-gold hover:bg-fm-gold/80"
          title="Dev Panel"
        >
          <Code className="h-5 w-5" />
        </Button>
      ) : (
        <div className="bg-background border-2 border-fm-gold rounded-lg shadow-xl p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-screamer text-lg text-fm-gold">Dev Panel</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {testScenarios.map((scenario) => (
              <div key={scenario.name} className="border border-border rounded p-2">
                <Button
                  variant="outline"
                  className="w-full justify-start mb-1 text-xs"
                  onClick={() => handleScenario(scenario.token)}
                >
                  {scenario.name}
                </Button>
                <p className="text-xs text-muted-foreground">{scenario.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
