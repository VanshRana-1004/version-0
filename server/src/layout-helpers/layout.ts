import { TimelineSegment,Clip } from "./timeline";
import { exec } from "child_process";

export async function createLayout(segment : TimelineSegment, outputPath : string){
    const start=segment.start;
    const end=segment.end;
    const duration=(end-start)/1000;
    const screen : Clip[]=segment.active.filter((clip : Clip)=>clip.type==='screen');
    const peers : Clip[]=segment.active.filter((clip : Clip)=>clip.type!=='screen');
    const peerTrim : number[]=[];
    peers.forEach((p : Clip)=>peerTrim.push((p.start-start)/1000))
    let command='';
    if(screen.length>0){
        const screenTrim=(screen[0].start-start)/1000;
        switch (peers.length){
            case 1 : 
                command = `ffmpeg -y -f lavfi -i color=c=1334x748:d=${duration} -ss ${screenTrim} -i "${screen[0].file}" -ss ${peerTrim[0]} -i "${peers[0].file}" -filter_complex "[1:v]scale=950:534:force_original_aspect_ratio=decrease[sc1];[2:v]scale=377:270:force_original_aspect_ratio=decrease[sc2];[0:v][sc1]overlay=2:2[tmp1];[tmp1][sc2]overlay=954:477[vout];[1:a][2:a]amix=inputs=2[aout]" -map "[vout]" -map "[aout]" -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k "${outputPath}"`;
                break;    
            case 2 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${screenTrim} -i "${screen[0].file}" -ss ${peerTrim[0]} -i "${peers[0].file}" -ss ${peerTrim[1]} -i "${peers[1].file}" -filter_complex "[1:v]scale=904:507:force_original_aspect_ratio=decrease[sc1];[2:v]scale=377:270:force_original_aspect_ratio=decrease[sc2];[3:v]scale=377:270:force_original_aspect_ratio=decrease[sc3];[0:v][sc1]overlay=2:121[tmp1];[tmp1][sc2]overlay=908:375[tmp2];[tmp2][sc3]overlay=908:2[vout];[1:a][2:a][3:a]amix=inputs=3[aout]" -map "[vout]" -map "[aout]" -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k "${outputPath}"`;
                break;    
            case 3 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${screenTrim} -i "${screen[0].file}" -ss ${peerTrim[0]} -i "${peers[0].file}" -ss ${peerTrim[1]} -i "${peers[1].file}" -ss ${peerTrim[2]} -i "${peers[2].file}" -filter_complex "[1:v]scale=904:507:force_original_aspect_ratio=decrease[sc1];[2:v]scale=380:247:force_original_aspect_ratio=decrease[sc2];[3:v]scale=380:247:force_original_aspect_ratio=decrease[sc3];[4:v]scale=380:247:force_original_aspect_ratio=decrease[sc4];[0:v][sc1]overlay=16:121[tmp1];[tmp1][sc2]overlay=936:2[tmp2];[tmp2][sc3]overlay=936:251[tmp3];[tmp3][sc4]overlay=936:500[vout];[1:a][2:a][3:a][4:a]amix=inputs=4[aout]" -map "[vout]" -map "[aout]" -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k "${outputPath}"`;
                break;    
            case 4 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${screenTrim} -i "${screen[0].file}" -ss ${peerTrim[0]} -i "${peers[0].file}" -ss ${peerTrim[1]} -i "${peers[1].file}" -ss ${peerTrim[2]} -i "${peers[2].file}" -ss ${peerTrim[3]} -i "${peers[3].file}" -filter_complex "[1:v]scale=904:507:force_original_aspect_ratio=decrease[sc1];[2:v]scale=300:236:force_original_aspect_ratio=decrease[sc2];[3:v]scale=300:236:force_original_aspect_ratio=decrease[sc3];[4:v]scale=423:371:force_original_aspect_ratio=decrease[sc4];[5:v]scale=423:371:force_original_aspect_ratio=decrease[sc5];[0:v][sc1]overlay=2:2[tmp1];[tmp1][sc2]overlay=103:511[tmp2];[tmp2][sc3]overlay=506:511[tmp3];[tmp3][sc4]overlay=908:375[tmp4];[tmp4][sc5]overlay=908:2[vout];[1:a][2:a][3:a][4:a][5:a]amix=inputs=5[aout]" -map "[vout]" -map "[aout]" -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k "${outputPath}"`;
                break;    
            case 5 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${screenTrim} -i "${screen[0].file}" -ss ${peerTrim[0]} -i "${peers[0].file}" -ss ${peerTrim[1]} -i "${peers[1].file}" -ss ${peerTrim[2]} -i "${peers[2].file}" -ss ${peerTrim[3]} -i "${peers[3].file}" -ss ${peerTrim[4]} -i "${peers[4].file}" -filter_complex "[1:v]scale=904:507:force_original_aspect_ratio=decrease[sc1];[2:v]scale=300:236:force_original_aspect_ratio=decrease[sc2];[3:v]scale=300:236:force_original_aspect_ratio=decrease[sc3];[4:v]scale=300:236:force_original_aspect_ratio=decrease[sc4];[5:v]scale=423:371:force_original_aspect_ratio=decrease[sc5];[6:v]scale=423:371:force_original_aspect_ratio=decrease[sc6];[0:v][sc1]overlay=2:2[tmp1];[tmp1][sc2]overlay=2:511[tmp2];[tmp2][sc3]overlay=304:511[tmp3];[tmp3][sc4]overlay=606:511[tmp4];[tmp4][sc5]overlay=908:375[tmp5];[tmp5][sc6]overlay=908:2[vout];[1:a][2:a][3:a][4:a][5:a][6:a]amix=inputs=6[aout]" -map "[vout]" -map "[aout]" -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k "${outputPath}"`;
                break;    
            default :
                command = ''
        }
    }   
    else{
        switch (peers.length){
            case 1 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${peerTrim[0]} -i "${peers[0].file}" -filter_complex "[1:v]scale=w=1333:h=749:force_original_aspect_ratio=decrease[overlayed];[0:v][overlayed]overlay=2:2[vout]" -map "[vout]" -map "1:a" -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k "${outputPath}"`;
                break;    
            case 2 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${peerTrim[0]} -i "${peers[0].file}" -ss ${peerTrim[1]} -i "${peers[1].file}" -filter_complex "[1:v]scale=620:480:force_original_aspect_ratio=decrease[sc1];[2:v]scale=620:480:force_original_aspect_ratio=decrease[sc2];[0:v][sc1]overlay=31:134[tmp1];[tmp1][sc2]overlay=682:134[vout]" -map "[vout]" -map "1:a" -map "2:a" -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k "${outputPath}"`;
                break;    
            case 3 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${peerTrim[0]} -i "${peers[0].file}" -ss ${peerTrim[1]} -i "${peers[1].file}" -ss ${peerTrim[2]} -i "${peers[2].file}" -filter_complex "[1:v]scale=500:350:force_original_aspect_ratio=decrease[sc1];[2:v]scale=500:350:force_original_aspect_ratio=decrease[sc2];[3:v]scale=500:350:force_original_aspect_ratio=decrease[sc3];[0:v][sc1]overlay=158:16[tmp1];[tmp1][sc2]overlay=674:16[tmp2];[tmp2][sc3]overlay=416:382[vout]" -map "[vout]" -map "1:a" -map "2:a" -map "3:a" -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k "${outputPath}"`;
                break;    
            case 4 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${peerTrim[0]} -i "${peers[0].file}" -ss ${peerTrim[1]} -i "${peers[1].file}" -ss ${peerTrim[2]} -i "${peers[2].file}" -ss ${peerTrim[3]} -i "${peers[3].file}" -filter_complex "[1:v]scale=500:350:force_original_aspect_ratio=decrease[sc1];[2:v]scale=500:350:force_original_aspect_ratio=decrease[sc2];[3:v]scale=500:350:force_original_aspect_ratio=decrease[sc3];[4:v]scale=500:350:force_original_aspect_ratio=decrease[sc4];[0:v][sc1]overlay=158:16[tmp1];[tmp1][sc2]overlay=674:16[tmp2];[tmp2][sc3]overlay=158:382[tmp3];[tmp3][sc4]overlay=674:382[vout]" -map "[vout]" -map "1:a" -map "2:a" -map "3:a" -map "4:a" -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k "${outputPath}"`;
                break;    
            case 5 : 
                command = `ffmpeg -y -f lavfi -i color=c=black:s=1334x748:d=${duration} -ss ${peerTrim[0]} -i "${peers[0].file}" -ss ${peerTrim[1]} -i "${peers[1].file}" -ss ${peerTrim[2]} -i "${peers[2].file}" -ss ${peerTrim[3]} -i "${peers[3].file}" -ss ${peerTrim[4]} -i "${peers[4].file}" -filter_complex "[1:v]scale=441:371:force_original_aspect_ratio=decrease[sc1];[2:v]scale=441:371:force_original_aspect_ratio=decrease[sc2];[3:v]scale=441:371:force_original_aspect_ratio=decrease[sc3];[4:v]scale=441:371:force_original_aspect_ratio=decrease[sc4];[5:v]scale=441:371:force_original_aspect_ratio=decrease[sc5];[0:v][sc1]overlay=3:2[tmp1];[tmp1][sc2]overlay=446:2[tmp2];[tmp2][sc3]overlay=890:2[tmp3];[tmp3][sc4]overlay=223:375[tmp4];[tmp4][sc5]overlay=667:375[vout]" -map "[vout]" -map "1:a" -map "2:a" -map "3:a" -map "4:a" -map "5:a" -t ${duration} -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 160k "${outputPath}"`;
                break;  
            default :
                command = ''
        }
    }   
    if(command==='') return;
    await new Promise<void>((resolve, reject) => {
        const ff = exec(command, (err, stdout, stderr) => {
        if (err) return reject(err);
            resolve();
        });

        ff.stdout?.on("data", data => console.log(data.toString()));
        ff.stderr?.on("data", data => console.log(data.toString()));
    });
    console.log("FFmpeg layout finished:", outputPath);
}