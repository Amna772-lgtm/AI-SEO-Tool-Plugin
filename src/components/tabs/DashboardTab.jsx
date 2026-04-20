/**
 * AI SEO Tool — DashboardTab
 * Shows GeoScoreRing, status code summary, and pages table.
 *
 * @package AI_SEO_Tool
 * @license GPL-2.0-or-later
 */
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Card, CardBody, Spinner, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import GeoScoreRing from '../GeoScoreRing';

/**
 * @param {Object} props
 * @param {string} props.siteId - Analysis site/job ID.
 * @param {Object} props.data   - Site data from useAnalysis polling.
 * @param {Object} props.plan   - Plan object from usePlan.
 */
export default function DashboardTab( { siteId, data, plan } ) {
    const [ pages, setPages ] = useState( [] );
    const [ geo, setGeo ] = useState( null );
    const [ loading, setLoading ] = useState( true );
    const [ error, setError ] = useState( null );

    const mainAppUrl = window.aiSeoTool?.mainAppUrl || '';

    useEffect( () => {
        if ( ! siteId ) {
            setLoading( false );
            return;
        }

        let cancelled = false;

        async function fetchData() {
            setLoading( true );
            setError( null );
            try {
                const [ pagesRes, geoRes ] = await Promise.all( [
                    apiFetch( { path: `/ai-seo-tool/v1/sites/${ siteId }/pages` } ),
                    apiFetch( { path: `/ai-seo-tool/v1/sites/${ siteId }/geo` } ),
                ] );
                if ( ! cancelled ) {
                    setPages( Array.isArray( pagesRes?.pages ) ? pagesRes.pages : [] );
                    setGeo( geoRes );
                }
            } catch ( err ) {
                if ( ! cancelled ) {
                    setError( err.message || __( 'Failed to load dashboard data.', 'ai-seo-tool' ) );
                }
            } finally {
                if ( ! cancelled ) {
                    setLoading( false );
                }
            }
        }

        fetchData();
        return () => { cancelled = true; };
    }, [ siteId ] );

    // Compute status code counts
    const statusCounts = pages.reduce( ( acc, page ) => {
        const code = page.status_code || 0;
        if ( code >= 500 ) acc[ '5xx' ] = ( acc[ '5xx' ] || 0 ) + 1;
        else if ( code >= 400 ) acc[ '4xx' ] = ( acc[ '4xx' ] || 0 ) + 1;
        else if ( code >= 300 ) acc[ '3xx' ] = ( acc[ '3xx' ] || 0 ) + 1;
        else if ( code >= 200 ) acc[ '2xx' ] = ( acc[ '2xx' ] || 0 ) + 1;
        return acc;
    }, {} );

    const score = geo?.score?.overall_score || 0;
    const grade = geo?.score?.grade || '';

    if ( loading ) {
        return (
            <div style={ { display: 'flex', alignItems: 'center', gap: '8px', padding: '24px' } }>
                <Spinner />
                <span>{ __( 'Loading dashboard…', 'ai-seo-tool' ) }</span>
            </div>
        );
    }

    if ( error ) {
        return (
            <Notice status="error" isDismissible={ false }>
                { error }
            </Notice>
        );
    }

    return (
        <div>
            {/* View Full Report link */}
            <div style={ { textAlign: 'right', marginBottom: '8px' } }>
                <a
                    href={ `${ mainAppUrl }/dashboard?site=${ siteId }` }
                    target="_blank"
                    rel="noreferrer"
                    style={ { fontSize: '12px', color: '#757575', textDecoration: 'none' } }
                    onMouseOver={ ( e ) => { e.target.style.textDecoration = 'underline'; } }
                    onMouseOut={ ( e ) => { e.target.style.textDecoration = 'none'; } }
                >
                    { __( 'View Full Report →', 'ai-seo-tool' ) }
                </a>
            </div>

            {/* Score + Status summary */}
            <div style={ {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
            } }>
                {/* GEO Score */}
                <Card>
                    <CardBody style={ { padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' } }>
                        <div style={ { marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#1e1e1e' } }>
                            { __( 'AI Citation Score', 'ai-seo-tool' ) }
                        </div>
                        <GeoScoreRing score={ score } grade={ grade } size={ 120 } />
                    </CardBody>
                </Card>

                {/* Status code summary */}
                <Card>
                    <CardBody style={ { padding: '24px' } }>
                        <div style={ { fontSize: '13px', fontWeight: 600, color: '#1e1e1e', marginBottom: '16px' } }>
                            { __( 'HTTP Status Summary', 'ai-seo-tool' ) }
                        </div>
                        <div style={ { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } }>
                            { [
                                { label: '2xx OK', key: '2xx', color: '#16a34a' },
                                { label: '3xx Redirect', key: '3xx', color: '#ca8a04' },
                                { label: '4xx Error', key: '4xx', color: '#dc2626' },
                                { label: '5xx Server', key: '5xx', color: '#7c3aed' },
                            ].map( ( { label, key, color } ) => (
                                <div key={ key } style={ { borderLeft: `3px solid ${ color }`, paddingLeft: '8px' } }>
                                    <div style={ { fontSize: '20px', fontWeight: 600, color } }>
                                        { statusCounts[ key ] || 0 }
                                    </div>
                                    <div style={ { fontSize: '12px', color: '#757575' } }>{ label }</div>
                                </div>
                            ) ) }
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Pages table */}
            <Card>
                <CardBody style={ { padding: '0' } }>
                    <div style={ { overflowX: 'auto' } }>
                        <table className="wp-list-table widefat fixed striped" style={ { marginBottom: 0 } }>
                            <thead>
                                <tr>
                                    <th scope="col" style={ { width: '35%' } }>{ __( 'URL', 'ai-seo-tool' ) }</th>
                                    <th scope="col" style={ { width: '8%' } }>{ __( 'Status', 'ai-seo-tool' ) }</th>
                                    <th scope="col" style={ { width: '12%' } }>{ __( 'Indexability', 'ai-seo-tool' ) }</th>
                                    <th scope="col" style={ { width: '20%' } }>{ __( 'Title', 'ai-seo-tool' ) }</th>
                                    <th scope="col" style={ { width: '15%' } }>{ __( 'H1', 'ai-seo-tool' ) }</th>
                                    <th scope="col" style={ { width: '5%' } }>{ __( 'Depth', 'ai-seo-tool' ) }</th>
                                </tr>
                            </thead>
                            <tbody>
                                { pages.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={ { textAlign: 'center', padding: '24px', color: '#757575' } }>
                                            { __( 'No pages found.', 'ai-seo-tool' ) }
                                        </td>
                                    </tr>
                                ) : (
                                    pages.map( ( page, idx ) => (
                                        <tr key={ page.address || idx }>
                                            <td style={ { wordBreak: 'break-all', fontSize: '12px' } }>
                                                <a href={ page.address } target="_blank" rel="noreferrer" style={ { color: '#0d9488' } }>
                                                    { page.address }
                                                </a>
                                            </td>
                                            <td>{ page.status_code || '—' }</td>
                                            <td>{ page.indexability === 'Indexable' ? __( 'Yes', 'ai-seo-tool' ) : __( 'No', 'ai-seo-tool' ) }</td>
                                            <td style={ { fontSize: '12px' } }>{ page.title || '—' }</td>
                                            <td style={ { fontSize: '12px' } }>{ page.h1 || '—' }</td>
                                            <td>{ page.crawl_depth ?? '—' }</td>
                                        </tr>
                                    ) )
                                ) }
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
