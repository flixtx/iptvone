import { createRef, useEffect, useState } from "react";
import ReactPlayer from "react-player";
import styles from "@/styles/player.module.css";
import { FaPlay, FaPause, FaRedoAlt, FaSignInAlt } from "react-icons/fa";
import { useTranslation } from 'next-i18next';
import { useFocusable, FocusContext } from "@noriginmedia/norigin-spatial-navigation";
import { loader } from "@/components/loader/loader";
import { toast } from 'react-toastify';

const Control = ({ icon, text, onClick, setControls, focusKey }) => {
    const { ref, focused } = useFocusable({
        onEnterPress: () => {
            setControls(control => control + 1);
            if(onClick)
            onClick();
        },
        onFocus: () => setControls(control => control + 1),
        focusKey: focusKey
    });

    return (
        <div ref={ ref } className={ (icon ? styles.controlWithIcon : styles.control) + " " +  (focused ? styles.controlfocused : "") + " d-flex flex-column justify-content-center align-items-center" } onClick={ () => onClick() }>
            { icon }
            <span className={ "text-medium fw-bold m-10" }>{ text }</span>
        </div>
    );
};

const PlayerControls = ({ playerProps, onAction, isStream, duration, progress }) => {
    const [ controls, setControls ] = useState(1);
    useEffect(() => {
        if(controls > 0) {
            const timer = window.setInterval(() => {
                setFocus('play-pause');
                setControls(0);
            }, 6000);

            return () => { 
                window.clearInterval(timer);
            }
        }
    }, [controls]);

    const { t } = useTranslation('common');
    const { ref, focusKey, focusSelf, setFocus } = useFocusable({
        onFocus: () => {
            setControls(control => control + 1);
        },
        onBlur: () => {
            setControls(0);
        },
        isFocusBoundary: true
    });

    useEffect(() => {
        setFocus('play-pause');
    }, [focusSelf]);

    let durationString = "";
    if(duration > 0)
    durationString = new Date(duration * 1000).toISOString().slice(11, 19);

    let progressString = "";
    if(progress && progress.playedSeconds > 0)
    progressString = new Date(progress.playedSeconds * 1000).toISOString().slice(11, 19);
    

    return (<FocusContext.Provider value={ focusKey }>
        { !controls && <div className={ styles.showControls } onMouseMove={ () => setControls(control => control + 1) }/> }
        { !controls && <div className={ styles.hideControls }/> }
        <div ref={ ref } className={ styles.controls + " d-flex flex-column justify-content-between" } style={{ width: playerProps.width, height: playerProps.height, zIndex: controls ? 100 : 0 }}>
            <div className="d-flex flex-column">
                <span className="text-medium fw-bold text-center">{ playerProps.channelName }</span>
                <span className="fw-bold text-center" style={{ fontSize: '10pt' }}>{ playerProps.url }</span>
                { !isStream && durationString.length > 0 && progressString.length > 0 && <span className="text-small fw-bold text-center">{ `${ progressString }/${ durationString }` }</span> }
                <div className="d-flex flew-row justify-content-center">
                {
                    !isStream &&
                    <div className="d-flex">
                        <Control
                            text={ '-20m' }
                            onClick={ () => onAction('seek:-20m') }
                            setControls={ setControls }
                            focusKey={ 'seek-20m' }
                        />
                        <Control
                            text={ '-5m' }
                            onClick={ () => onAction('seek:-5m') }
                            setControls={ setControls }
                            focusKey={ 'seek-5m' }
                        />
                        <Control
                            text={ '-30s' }
                            onClick={ () => onAction('seek:-30s') }
                            setControls={ setControls }
                            focusKey={ 'seek-30s' }
                        />
                        <Control
                            text={ '+30s' }
                            onClick={ () => onAction('seek:+30s') }
                            setControls={ setControls }
                            focusKey={ 'seek+30s' }
                        />
                        <Control
                            text={ '+5m' }
                            onClick={ () => onAction('seek:+5m') }
                            setControls={ setControls }
                            focusKey={ 'seek+5m' }
                        />
                        <Control
                            text={ '+20m' }
                            onClick={ () => onAction('seek:+20m') }
                            setControls={ setControls }
                            focusKey={ 'seek+20m' }
                        />
                    </div>
                }
                </div>
            </div>
            <div className="d-flex flex-row justify-content-between">
                <div className="d-flex">
                    {
                        playerProps.playing ?
                            <Control
                                icon={ <FaPause/> }
                                text={ t('COMPONENTS.PLAYER.PAUSE') }
                                onClick={ () => onAction('pause') }
                                setControls={ setControls }
                                focusKey={ 'play-pause' }
                            />
                        :
                            <Control
                                icon={ <FaPlay/> }
                                text={ t('COMPONENTS.PLAYER.PLAY') }
                                onClick={ () => onAction('play') }
                                setControls={ setControls }
                                focusKey={ 'play-pause' }
                            />
                    }
                    {
                        !isStream &&
                        <Control
                            icon={ <FaRedoAlt/> }
                            text={ t('COMPONENTS.PLAYER.REPLAY') }
                            onClick={ () => onAction('replay') }
                            setControls={ setControls }
                            focusKey={ 'replay' }
                        />
                    }
                </div>
                <Control
                    icon={ <FaSignInAlt/> }
                    text={ t('COMPONENTS.PLAYER.EXIT') }
                    onClick={ () => onAction('close') }
                    setControls={ setControls }
                    focusKey={ 'close' }
                />
            </div>
        </div>
    </FocusContext.Provider>);
};

const Player = (props) => {
    const isStream = props.url.includes('m3u');
    const [ windowLoaded, setWindowLoaded ] = useState(false);
    const [ playing, setPlaying ] = useState(isStream);
    const [ progress, setProgress ] = useState(null);
    const [ duration, setDuration ] = useState(null);
    const playerRef = createRef();

    const handleControlAction = (action) => {
        let newSeconds = 0;
        switch(action) {
            case 'play':
                setPlaying(true);
                break;
            case 'replay':
                playerRef.current.seekTo(0);
                break;
            case 'pause':
                setPlaying(false);
                break;
            case 'close':
                if(props.onClose) {
                    loader(false);
                    props.onClose();
                }
                break;
            case 'seek:-20m':
                newSeconds = playerRef.current.getCurrentTime() - 1200;
                if(newSeconds < 0) newSeconds = 0;
                playerRef.current.seekTo(newSeconds);
                break;
            case 'seek:-5m':
                newSeconds = playerRef.current.getCurrentTime() - 300;
                if(newSeconds < 0) newSeconds = 0;
                playerRef.current.seekTo(newSeconds);
                break;
            case 'seek:-30s':
                newSeconds = playerRef.current.getCurrentTime() - 30;
                if(newSeconds < 0) newSeconds = 0;
                playerRef.current.seekTo(newSeconds);
                break;
            case 'seek:+30s':
                newSeconds = playerRef.current.getCurrentTime() + 30;
                if(newSeconds > duration) newSeconds = duration - 1;
                playerRef.current.seekTo(newSeconds);
                break;
            case 'seek:+5m':
                newSeconds = playerRef.current.getCurrentTime() + 300;
                if(newSeconds > duration) newSeconds = duration - 1;
                playerRef.current.seekTo(newSeconds);
                break;
            case 'seek:+20m':
                newSeconds = playerRef.current.getCurrentTime() + 1200;
                if(newSeconds > duration) newSeconds = duration - 1;
                playerRef.current.seekTo(newSeconds);
                break;
        }
    };

    useEffect(() => {
        if(typeof window !== 'undefined') {
            setWindowLoaded(true);
            loader(true, { opacity: 0.1 });
        }
    }, []);

    useEffect(() => {
        if(typeof window !== 'undefined') {
            const handleKeyDown = (e) => {
                const keyCode = e.keyCode || e.which;
                if(keyCode === 461 /* LG Back Button */ || keyCode === 10009 /* Samsung Back Button */ || keyCode === 27 /* Esc */) {
                    if(props.onClose) {
                        loader(false);
                        props.onClose();
                    }
                }
                else if(keyCode === 32 /* Space */) {
                    if(playing) handleControlAction('pause');
                    else handleControlAction('play');
                }
            };
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }
    }, [playing]);

    useEffect(() => {
        if(progress === null && duration && !playing && playerRef?.current && props.playedSeconds > 0) {
            if(duration > props.playedSeconds)
            playerRef.current.seekTo(props.playedSeconds);
        }
    }, [playerRef, props.playedSeconds, duration]);

    if(!windowLoaded)
    return <></>;

    return (
        <div className={ styles.container } style={{ width: props.width, height: props.height }}>
            <PlayerControls
                playerProps={ { playing: playing, ...props } }
                onAction={ handleControlAction }    
                isStream={ isStream }
                duration={ duration }
                progress={ progress }
            />
            <ReactPlayer
                ref={ playerRef }
                url={ props.url }
                className={ styles.player }
                width={ props.width }
                height={ props.height }
                controls={ false }
                playing={ playing }
                config={{
                    file: {
                        forceHLS: isStream,
                        forceSafariHLS: isStream
                    }
                }}
                onProgress={ progress => {
                    setProgress(progress);
                    
                    if(props.onProgress)
                    props.onProgress(progress);
                } }
                onSeek={ () => !playing && setPlaying(true) }
                onEnded={ () => {
                    setPlaying(false);
                    if(props.onEnded) {
                        loader(false);
                        props.onEnded();
                    }
                }}
                onDuration={ (duration) => {
                    if(!props.playedSeconds && !playing)
                    setPlaying(true);

                    setDuration(duration);
                } }
                onBuffer={ () => loader(true, { opacity: 0.1 }) }
                onBufferEnd={ () => loader(false) }
                onError={
                    (error) => {
                        loader(false);
                        toast.error(error.message);
                    }
                }
            />
        </div>
    );
};

export default Player;