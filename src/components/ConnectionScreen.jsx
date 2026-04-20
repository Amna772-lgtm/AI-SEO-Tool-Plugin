/**
 * AI SEO Tool — Connection Screen
 * Card-based layout for API key entry and connect flow.
 *
 * @package AI_SEO_Tool
 * @license GPL-2.0-or-later
 */
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import {
    Card,
    CardHeader,
    CardBody,
    TextControl,
    Button,
    Notice,
    Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Connection screen component.
 *
 * @param {Object}   props
 * @param {Function} props.onConnected - Called when connection succeeds.
 */
export default function ConnectionScreen( { onConnected } ) {
    const [ apiKey, setApiKey ] = useState( '' );
    const [ backendUrl, setBackendUrl ] = useState( '' );
    const [ connecting, setConnecting ] = useState( false );
    const [ error, setError ] = useState( null );

    const handleConnect = async () => {
        setConnecting( true );
        setError( null );

        try {
            const response = await apiFetch( {
                path: '/ai-seo-tool/v1/connect',
                method: 'POST',
                data: { api_key: apiKey, backend_url: backendUrl },
            } );

            if ( response && response.status === 'connected' ) {
                onConnected();
            } else {
                setError( __( 'Connection failed. Please check your credentials and try again.', 'ai-seo-tool' ) );
            }
        } catch ( err ) {
            const code = err.code || err.status;
            if ( code === 401 || err.message?.includes( '401' ) ) {
                setError( __( 'Invalid API key. Generate a key from your AI SEO Tool account under Settings → API Keys.', 'ai-seo-tool' ) );
            } else if ( code === 502 || err.message?.includes( '502' ) ) {
                setError( __( 'Could not connect to the AI SEO Tool backend. Verify the backend URL.', 'ai-seo-tool' ) );
            } else {
                setError( err.message || __( 'Connection failed. Please check your credentials and try again.', 'ai-seo-tool' ) );
            }
        } finally {
            setConnecting( false );
        }
    };

    const isDisabled = ! apiKey.trim() || ! backendUrl.trim() || connecting;

    return (
        <div style={ { marginTop: '24px' } }>
            <div style={ { maxWidth: '480px', margin: '0 auto' } }>
                <Card>
                    <CardHeader>
                        <h2 style={ { margin: 0 } }>
                            { __( 'Connect to AI SEO Tool', 'ai-seo-tool' ) }
                        </h2>
                    </CardHeader>
                    <CardBody style={ { padding: '24px' } }>
                        <p style={ { marginTop: 0 } }>
                            { __( 'Enter your API key to connect this WordPress site to your AI SEO Tool account.', 'ai-seo-tool' ) }
                        </p>

                        <TextControl
                            label={ __( 'API Key', 'ai-seo-tool' ) }
                            placeholder={ __( 'Paste your API key here', 'ai-seo-tool' ) }
                            value={ apiKey }
                            onChange={ ( value ) => setApiKey( value ) }
                            disabled={ connecting }
                            type="password"
                        />

                        <TextControl
                            label={ __( 'Backend URL', 'ai-seo-tool' ) }
                            placeholder="https://your-instance.example.com"
                            value={ backendUrl }
                            onChange={ ( value ) => setBackendUrl( value ) }
                            disabled={ connecting }
                            type="url"
                        />

                        <Button
                            variant="primary"
                            onClick={ handleConnect }
                            disabled={ isDisabled }
                            style={ {
                                width: '100%',
                                justifyContent: 'center',
                                backgroundColor: connecting ? undefined : '#0d9488',
                                borderColor: connecting ? undefined : '#0d9488',
                            } }
                        >
                            { connecting ? (
                                <>
                                    <Spinner />
                                    { __( 'Connecting…', 'ai-seo-tool' ) }
                                </>
                            ) : (
                                __( 'Connect Account', 'ai-seo-tool' )
                            ) }
                        </Button>

                        { error && (
                            <div style={ { marginTop: '12px' } }>
                                <Notice
                                    status="error"
                                    isDismissible={ false }
                                >
                                    { error }
                                </Notice>
                            </div>
                        ) }
                    </CardBody>
                </Card>

                <p style={ { textAlign: 'center', fontSize: '12px', color: '#757575', marginTop: '12px' } }>
                    { __( "Don't have an account?", 'ai-seo-tool' ) }{ ' ' }
                    <a
                        href="http://localhost:3000/signup"
                        target="_blank"
                        rel="noreferrer"
                        style={ { color: '#757575' } }
                    >
                        { __( 'Sign up →', 'ai-seo-tool' ) }
                    </a>
                </p>
            </div>
        </div>
    );
}
