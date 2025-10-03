'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, AlertCircle, Loader2, Unlink } from 'lucide-react';

interface GoogleClassroomConnectProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface Connection {
  connection_id: string;
  status: string;
  connected_at: string;
  user_email?: string;
  user_name?: string;
  user_picture?: string;
}

export default function GoogleClassroomConnect({ isOpen, onClose, userId }: GoogleClassroomConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Google Classroom auth config ID from your Composio setup
  const GOOGLE_CLASSROOM_AUTH_CONFIG_ID = 'ac_2uIibC1LpJ1s';

  useEffect(() => {
    if (isOpen && userId) {
      checkConnectionStatus();
    }
  }, [isOpen, userId]);

  const checkConnectionStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/composio/connections');
      const data = await response.json();
      
      if (data.success) {
        setConnection(data.connection);
        setIsConnected(data.isConnected);
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setError('Failed to check connection status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Initiate the authentication flow
      const response = await fetch('/api/composio/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          authConfigId: GOOGLE_CLASSROOM_AUTH_CONFIG_ID,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Open the authentication URL in a new window
        const authWindow = window.open(
          data.redirectUrl,
          'google-classroom-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        // Poll for connection completion
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(
              `/api/composio/auth?connectionId=${data.connectionId}`
            );
            const statusData = await statusResponse.json();

            if (statusData.success && statusData.status === 'ACTIVE') {
              clearInterval(pollInterval);
              authWindow?.close();

              // Store the connection in our database
              await fetch('/api/composio/connections', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  connectionId: data.connectionId,
                  status: 'ACTIVE',
                }),
              });

              setIsConnected(true);
              setConnection({
                connection_id: data.connectionId,
                status: 'ACTIVE',
                connected_at: new Date().toISOString(),
              });
              setIsConnecting(false);
            }
          } catch (error) {
            console.error('Error polling connection status:', error);
          }
        }, 2000);

        // Stop polling after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          if (isConnecting) {
            setIsConnecting(false);
            setError('Authentication timed out. Please try again.');
          }
        }, 300000);
      } else {
        setError(data.error || 'Failed to initiate authentication');
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('Error connecting to Google Classroom:', error);
      setError('Failed to connect to Google Classroom');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/composio/connections', {
        method: 'DELETE',
      });

      if (response.ok) {
        setIsConnected(false);
        setConnection(null);
      } else {
        setError('Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      setError('Failed to disconnect');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Google Classroom Integration
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Checking connection...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <div className="flex-1">
                    <span className="text-green-700 font-medium">Connected to Google Classroom</span>
                    {connection && (
                      <div className="text-green-600 text-sm space-y-1">
                        <p>Account: {connection.user_email || 'Unknown email'}</p>
                        <p>Connected on {new Date(connection.connected_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">What you can do now:</h3>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• Ask the AI: "What assignments do I have due this week?"</li>
                    <li>• Get real course information from your Google Classroom</li>
                    <li>• View actual assignment due dates and descriptions</li>
                    <li>• Get study reminders based on your real coursework</li>
                    <li>• Integrate your actual assignments with StudyPal's planning</li>
                  </ul>
                </div>

                <button
                  onClick={handleDisconnect}
                  className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect Google Classroom
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Connect your Real Google Classroom</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Connect your actual Google Classroom account to access your real courses, assignments, 
                    and due dates. This uses secure Google OAuth authentication.
                  </p>
                  <ul className="text-gray-600 text-sm space-y-1">
                    <li>• Access your real Google Classroom courses</li>
                    <li>• Get actual assignment due dates and descriptions</li>
                    <li>• Secure OAuth authentication with your Google account</li>
                    <li>• Read-only access - we never modify your classroom data</li>
                    <li>• Integrate real coursework with StudyPal's AI planning</li>
                  </ul>
                </div>

                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect Google Classroom
                    </>
                  )}
                </button>

                {isConnecting && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-700 text-sm">
                      A new window will open for authentication. Please complete the login process 
                      and grant permissions to continue.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
