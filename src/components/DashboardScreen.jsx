/**
 * AI SEO Tool — Dashboard Screen
 * Main dashboard with account info, analyze button, progress, and result tabs.
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
    Button,
    TabPanel,
    Notice,
    Spinner,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import usePlan from '../hooks/usePlan';
import useAnalysis from '../hooks/useAnalysis';
import AnalysisProgress from './AnalysisProgress';
import DashboardTab from './tabs/DashboardTab';
import GeoAnalysisTab from './tabs/GeoAnalysisTab';
import TechnicalAuditTab from './tabs/TechnicalAuditTab';
import HistoryTab from './tabs/HistoryTab';

/** Maps WP admin sub-menu slug to tab name. */
const PAGE_TO_TAB = {
    'ai-seo-tool':           'dashboard',
    'ai-seo-tool-geo':       'geo',
    'ai-seo-tool-technical': 'technical',
    'ai-seo-tool-history':   'history',
    'ai-seo-tool-settings':  'settings',
};

/**
 * @param {Object}   props
 * @param {string}   props.currentPage    - Active WP sub-menu slug.
 * @param {Function} props.onDisconnected - Called after disconnect action.
 */
const SESSION_KEY_SITE_ID  = 'ai_seo_tool_site_id';
const SESSION_KEY_COMPLETE = 'ai_seo_tool_analysis_complete';

export default function DashboardScreen( { currentPage, onDisconnected } ) {
    const { plan, loading: planLoading, error: planError } = usePlan();
    const [ siteId, setSiteIdState ] = useState( () => sessionStorage.getItem( SESSION_KEY_SITE_ID ) || null );
    const [ analysisComplete, setAnalysisCompleteState ] = useState( () => sessionStorage.getItem( SESSION_KEY_COMPLETE ) === 'true' );
    const [ analyzeError, setAnalyzeError ] = useState( null );
    const [ disconnecting, setDisconnecting ] = useState( false );

    const setSiteId = ( id ) => {
        if ( id ) sessionStorage.setItem( SESSION_KEY_SITE_ID, id );
        else sessionStorage.removeItem( SESSION_KEY_SITE_ID );
        setSiteIdState( id );
    };

    const setAnalysisComplete = ( val ) => {
        if ( val ) sessionStorage.setItem( SESSION_KEY_COMPLETE, 'true' );
        else sessionStorage.removeItem( SESSION_KEY_COMPLETE );
        setAnalysisCompleteState( val );
    };

    const { status, data: analysisData, error: pollError, reset: resetAnalysis } = useAnalysis( siteId );

    // Detect completion / failure
    const isFailed  = status === 'failed';
    const isRunning = siteId && status && status !== 'completed' && status !== 'failed';
    const isComplete = status === 'completed' || analysisComplete;

    if ( status === 'completed' && ! analysisComplete ) {
        setAnalysisComplete( true );
    }

    // Settings page
    if ( currentPage === 'ai-seo-tool-settings' ) {
        return (
            <SettingsPage
                onDisconnected={ onDisconnected }
                disconnecting={ disconnecting }
                setDisconnecting={ setDisconnecting }
            />
        );
    }

    const handleAnalyze = async () => {
        setAnalyzeError( null );
        resetAnalysis();
        setAnalysisComplete( false );
        setSiteId( null );

        try {
            const response = await apiFetch( {
                path: '/ai-seo-tool/v1/analyze',
                method: 'POST',
                data: { url: window.aiSeoTool?.siteUrl },
            } );
            setSiteId( response.site_id || response.id );
        } catch ( err ) {
            const code = err.code || err.status;
            if ( code === 402 ) {
                setAnalyzeError( __( "You've reached your audit quota. Upgrade your plan to run more audits.", 'ai-seo-tool' ) );
            } else {
                setAnalyzeError( err.message || __( 'Failed to start analysis. Please try again.', 'ai-seo-tool' ) );
            }
        }
    };

    const handleTryAgain = () => {
        setSiteId( null );
        setAnalysisComplete( false );
        resetAnalysis();
        setAnalyzeError( null );
    };

    const quotaExhausted = plan && plan.audit_limit !== null && plan.audit_limit !== undefined && plan.audit_count >= plan.audit_limit;

    const initialTabName = PAGE_TO_TAB[ currentPage ] || 'dashboard';

    const tabs = [
        { name: 'dashboard', title: __( 'Dashboard', 'ai-seo-tool' ) },
        { name: 'geo',       title: __( 'GEO Analysis', 'ai-seo-tool' ) },
        { name: 'technical', title: __( 'Technical Audit', 'ai-seo-tool' ) },
        { name: 'history',   title: __( 'History', 'ai-seo-tool' ) },
    ];

    return (
        <div style={ { marginTop: '24px' } }>

            {/* Account Info Card */}
            <Card style={ { marginBottom: '24px' } }>
                <CardBody style={ { padding: '16px 24px' } }>
                    { planLoading && (
                        <div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
                            <Spinner />
                            <span>{ __( 'Loading account info…', 'ai-seo-tool' ) }</span>
                        </div>
                    ) }

                    { planError && (
                        <Notice status="error" isDismissible={ false }>
                            { planError }
                        </Notice>
                    ) }

                    { plan && (
                        <>
                            <div style={ {
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '16px',
                                marginBottom: '16px',
                            } }>
                                <div>
                                    <div style={ { fontSize: '11px', color: '#757575', textTransform: 'uppercase', letterSpacing: '0.05em' } }>
                                        { __( 'Plan', 'ai-seo-tool' ) }
                                    </div>
                                    <div style={ { fontSize: '13px', fontWeight: 600 } }>
                                        { plan.plan || __( 'Free', 'ai-seo-tool' ) }
                                    </div>
                                </div>
                                <div>
                                    <div style={ { fontSize: '11px', color: '#757575', textTransform: 'uppercase', letterSpacing: '0.05em' } }>
                                        { __( 'Audits Used', 'ai-seo-tool' ) }
                                    </div>
                                    <div style={ { fontSize: '13px', fontWeight: 600 } }>
                                        { plan.audit_count } / { plan.audit_limit !== null && plan.audit_limit !== undefined ? plan.audit_limit : __( 'Unlimited', 'ai-seo-tool' ) }
                                    </div>
                                </div>
                                <div>
                                    <div style={ { fontSize: '11px', color: '#757575', textTransform: 'uppercase', letterSpacing: '0.05em' } }>
                                        { __( 'Account', 'ai-seo-tool' ) }
                                    </div>
                                    <div style={ { fontSize: '13px', fontWeight: 600 } }>
                                        { plan.email || plan.name || '—' }
                                    </div>
                                </div>
                            </div>

                            { quotaExhausted ? (
                                <div>
                                    <Notice status="warning" isDismissible={ false }>
                                        { sprintf(
                                            /* translators: %d: number of audits */
                                            __( "You've used all %d audits this period. Upgrade your plan to run more audits.", 'ai-seo-tool' ),
                                            plan.audit_limit
                                        ) }
                                    </Notice>
                                    <Button
                                        variant="primary"
                                        onClick={ () => window.open( 'http://localhost:3000/select-plan', '_blank' ) }
                                        style={ {
                                            marginTop: '12px',
                                            backgroundColor: '#0d9488',
                                            borderColor: '#0d9488',
                                        } }
                                    >
                                        { __( 'Upgrade Plan', 'ai-seo-tool' ) }
                                    </Button>
                                </div>
                            ) : isRunning ? (
                                <AnalysisProgress status={ status } />
                            ) : isFailed ? (
                                <>
                                    <Notice status="error" isDismissible={ false }>
                                        { pollError || __( 'Audit failed. Check the AI SEO Tool backend logs for details.', 'ai-seo-tool' ) }
                                    </Notice>
                                    <Button
                                        variant="secondary"
                                        onClick={ handleTryAgain }
                                        style={ { marginTop: '12px' } }
                                    >
                                        { __( 'Try Again', 'ai-seo-tool' ) }
                                    </Button>
                                </>
                            ) : (
                                <>
                                    { analyzeError && (
                                        <Notice status="error" isDismissible={ false } style={ { marginBottom: '12px' } }>
                                            { analyzeError }
                                        </Notice>
                                    ) }
                                    <Button
                                        variant="primary"
                                        onClick={ handleAnalyze }
                                        disabled={ quotaExhausted }
                                        style={ {
                                            width: '100%',
                                            justifyContent: 'center',
                                            height: '40px',
                                            backgroundColor: '#0d9488',
                                            borderColor: '#0d9488',
                                        } }
                                    >
                                        { __( 'Analyze This Site', 'ai-seo-tool' ) }
                                    </Button>
                                </>
                            ) }
                        </>
                    ) }
                </CardBody>
            </Card>

            {/* Results Tab Panel */}
            <TabPanel
                tabs={ tabs }
                initialTabName={ initialTabName }
            >
                { ( tab ) => (
                    <div style={ { padding: '24px 0' } }>
                        { isComplete ? (
                            <>
                                { tab.name === 'dashboard' && (
                                    <DashboardTab siteId={ siteId } data={ analysisData } plan={ plan } />
                                ) }
                                { tab.name === 'geo' && (
                                    <GeoAnalysisTab siteId={ siteId } plan={ plan } />
                                ) }
                                { tab.name === 'technical' && (
                                    <TechnicalAuditTab siteId={ siteId } plan={ plan } />
                                ) }
                                { tab.name === 'history' && (
                                    <HistoryTab plan={ plan } />
                                ) }
                            </>
                        ) : (
                            <>
                                { tab.name === 'history' ? (
                                    <HistoryTab plan={ plan } />
                                ) : (
                                    <EmptyState />
                                ) }
                            </>
                        ) }
                    </div>
                ) }
            </TabPanel>
        </div>
    );
}

function EmptyState() {
    return (
        <Card>
            <CardBody style={ { padding: '48px 24px', textAlign: 'center' } }>
                <h3 style={ { marginTop: 0 } }>{ __( 'No audits yet', 'ai-seo-tool' ) }</h3>
                <p style={ { color: '#757575' } }>
                    { __( "Click 'Analyze This Site' to run your first GEO citation readiness audit.", 'ai-seo-tool' ) }
                </p>
            </CardBody>
        </Card>
    );
}

function SettingsPage( { onDisconnected, disconnecting, setDisconnecting } ) {
    const [ error, setError ] = useState( null );

    const handleDisconnect = async () => {
        setDisconnecting( true );
        setError( null );
        try {
            await apiFetch( {
                path: '/ai-seo-tool/v1/disconnect',
                method: 'POST',
            } );
            onDisconnected();
        } catch ( err ) {
            setError( err.message || __( 'Failed to disconnect. Please try again.', 'ai-seo-tool' ) );
            setDisconnecting( false );
        }
    };

    return (
        <div style={ { marginTop: '24px', maxWidth: '480px' } }>
            <Card>
                <CardHeader>
                    <h2 style={ { margin: 0 } }>{ __( 'Settings', 'ai-seo-tool' ) }</h2>
                </CardHeader>
                <CardBody style={ { padding: '24px' } }>
                    { window.aiSeoTool?.mainAppUrl && (
                        <div style={ { marginBottom: '16px' } }>
                            <div style={ { fontSize: '11px', color: '#757575', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' } }>
                                { __( 'Backend URL', 'ai-seo-tool' ) }
                            </div>
                            <code style={ { fontSize: '13px' } }>{ window.aiSeoTool.mainAppUrl }</code>
                        </div>
                    ) }

                    { error && (
                        <Notice status="error" isDismissible={ false } style={ { marginBottom: '12px' } }>
                            { error }
                        </Notice>
                    ) }

                    <Button
                        variant="secondary"
                        isDestructive
                        onClick={ handleDisconnect }
                        disabled={ disconnecting }
                    >
                        { disconnecting ? (
                            <>
                                <Spinner />
                                { __( 'Disconnecting…', 'ai-seo-tool' ) }
                            </>
                        ) : (
                            __( 'Disconnect Plugin', 'ai-seo-tool' )
                        ) }
                    </Button>
                </CardBody>
            </Card>
        </div>
    );
}
