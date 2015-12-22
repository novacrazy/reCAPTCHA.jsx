/**
 * Created by novacrazy on 6/17/2015.
 */

import * as React from 'react';

class ReCaptcha extends React.Component {
    static displayName = 'ReCaptcha';

    //Made static to the ReCaptcha component so it can be changed
    static API_URL = 'https://www.google.com/recaptcha/api.js';

    //Also made static so they can be changed
    static onLoadCallbackName = 'onReCaptchaLoadCallback';
    static onVerifyCallbackName = 'onReCaptchaVerifyCallback';
    static onExpiredCallbackName = 'onReCaptchaExpiredCallback';

    static propTypes = {
        onLoad:       React.PropTypes.func,
        onVerify:     React.PropTypes.func,
        onExpired:    React.PropTypes.func,
        id:           React.PropTypes.string.isRequired,
        sitekey:      React.PropTypes.string.isRequired,
        theme:        React.PropTypes.oneOf( ['light', 'dark'] ),
        type:         React.PropTypes.oneOf( ['image', 'audio'] ),
        render:       React.PropTypes.oneOf( ['explicit', 'onLoad'] ),
        size:         React.PropTypes.oneOf( ['compact', 'normal'] ),
        tabindex:     React.PropTypes.number,
        noscriptText: React.PropTypes.node
    };

    static defaultProps = {
        theme:        'light',
        type:         'image',
        render:       'onLoad',
        size:         'normal',
        tabindex:     0,
        noscriptText: "You have JavaScript disabled and will be unable to verify your identity through reCAPTCHA."
    };

    static loaded = false;
    static loading = false;

    state = {
        verified:  false,
        expired:   false,
        widget_id: null
    };

    /*
     * This is just a very simpler script loader, and can be overriden by a better one if needed
     * */
    loadScript( options = {} ) {
        const self = this;

        const {src, onLoad, async = true, defer = true, type = 'text/javascript', document = window.document} = options;

        let head = document.getElementsByTagName( 'head' )[0] ||
                   document.getElementsByTagName( 'body' )[0];

        let script = document.createElement( 'script' );

        script.src = src;
        script.type = type;

        /*
         * The following two if-in statements mimic how Modernizr tests for it
         * */

        if( 'async' in script ) {
            script.async = async;
        }

        if( 'defer' in script ) {
            script.defer = defer;
        }

        let ran = false;

        script.onload = script.onreadystatechange = function() {
            let rs = this.readyState;

            if( !ran && (rs === 'complete' || rs === 'loaded') ) {
                ran = true;

                if( typeof onLoad === 'function' ) {
                    onLoad();
                }
            }
        };

        head.appendChild( script );
    }

    onExpired() {
        this.setState( {
            verified: false,
            expired:  true
        } );

        const {onExpired} = this.props;

        if( typeof onExpired === 'function' ) {
            onExpired();
        }
    }

    onVerify() {
        this.setState( {
            verified: true,
            expired:  false
        } );

        const {onVerify} = this.props;

        if( typeof onVerify === 'function' ) {
            onVerify();
        }
    }

    onLoad() {
        const {id, sitekey, onVerify, onLoad, theme, type, size, tabindex} = this.props;

        const {grecaptcha} = window;

        if( !grecaptcha || typeof grecaptcha.render !== 'function' ) {
            alert( "ReCaptcha failed to load. Please reload the page." );

            return false;

        } else {
            let widget_id = grecaptcha.render( id, {
                'sitekey':          sitekey,
                'callback':         this.onVerify.bind( this ),
                'expired-callback': this.onExpired.bind( this ),
                'theme':            theme,
                'type':             type,
                'size':             size,
                'tabindex':         tabindex
            } );

            this.setState( {widget_id} )
        }

        if( typeof onLoad === 'function' ) {
            onLoad();
        }

        ReCaptcha.loaded = true;
        ReCaptcha.loading = false;
    }

    reset() {
        const {widget_id} = this.state;
        const {grecaptcha} = window;

        return grecaptcha.reset( widget_id );
    }

    getResponse() {
        const {widget_id} = this.state;
        const {grecaptcha} = window;

        return grecaptcha.getResponse( widget_id );
    }

    componentDidMount() {
        const {id, render} = this.props;

        let src = ReCaptcha.API_URL;

        if( render === 'explicit' ) {
            if( ReCaptcha.loaded ) {
                return this.onLoad();
            }

            let onLoadCallback = window[ReCaptcha.onLoadCallbackName];

            if( typeof onLoadCallback === 'function' ) {
                let oldOnLoadCallback = onLoadCallback;

                onLoadCallback = () => {
                    oldOnLoadCallback();

                    this.onLoad();
                };

            } else {
                onLoadCallback = this.onLoad.bind( this );
            }

            window[ReCaptcha.onLoadCallbackName] = onLoadCallback;

            src += `?onload=${ReCaptcha.onLoadCallbackName}&render=explicit`;

        } else {
            if( ReCaptcha.loading || ReCaptcha.loaded ) {
                throw new Error( 'Only one ReCaptcha instance can be used with onLoad rendering' );
            }

            window[ReCaptcha.onVerifyCallbackName] = this.onVerify.bind( this );
            window[ReCaptcha.onExpiredCallbackName] = this.onExpired.bind( this );
        }

        if( !ReCaptcha.loading ) {
            ReCaptcha.loading = true;

            this.loadScript( {src} );
        }
    }

    shouldComponentUpdate() {
        return false;
    }

    render() {
        const {id, render, noscriptText} = this.props;

        if( render === 'explicit' ) {
            return (
                <div>
                    {!!noscriptText ? (<noscript><br/>{noscriptText}<br/></noscript>) : ''}

                    <div id={id} className="g-recaptcha"
                         data-callback={ReCaptcha.onVerifyCallbackName}
                         data-expired-callback={ReCaptcha.onExpiredCallbackName}></div>
                </div>
            );

        } else {
            const {sitekey, theme, type, size, tabindex} = this.props;

            return (
                <span>
                    {!!noscriptText ? (<noscript><br/>{noscriptText}<br/></noscript>) : ''}

                    <div id={id} className='g-recaptcha'
                         data-callback={ReCaptcha.onVerifyCallbackName}
                         data-expired-callback={ReCaptcha.onExpiredCallbackName}
                         data-sitekey={sitekey}
                         data-theme={theme}
                         data-type={type}
                         data-size={size}
                         data-tabindex={tabindex}></div>
                </span>
            );
        }
    }
}

export default ReCaptcha;
