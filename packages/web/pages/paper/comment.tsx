import type { NextPage } from 'next'
import { Footer } from '../../components/Footer/Footer';
//import Head from 'next/head'
import Link from 'next/link'
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../../context";
import {
    getPaperContractByAddress
} from "../../context";
import fs from 'fs'; 

import { NFTStorage } from 'nft.storage'
import ConnectModal from '../../components/common/modal/ConnectModal';
import MintingModal from '../../components/common/modal/CreateCommentModal';
 
const NFTStorageAPIKey = process.env.NFT_STORAGE_KEY;

interface Props {
    svgFilePayload: string
}

const NewComment : NextPage<Props> = (props) => {

    const { paperManagerContract } = useContext(AppContext);
    const { paperContract  } = useContext(AppContext);
    const { web3Provider , signer , signerAddr } = useContext(AppContext);
    const { isConnected, connectWallet } = useContext(AppContext)
    const [ isModal, setIsModal ] = useState<number>(0)
    const { paperId  } = useContext(AppContext);
    //const [ comment, setComment ] = useState();
    const [ svgBlobUrl, setSvgBlobUrl ] = useState<string>();
    const [ transactionHash, setTransactionHash ] = useState("DEFAULT HASH")
    const [ nftAddress, setNftAddres ] = useState('DEFAULT ADDRESS')
    //const [ svgBlob, setSvgBlob ] = useState<string>();
    const [ totalNftItems, setTotalNftItems ] = useState(0);
    const [ paperTitle, setPaperTitle ] = useState<string>()
    const [ paperOwnerName , setPaperOwnerName ] = useState<string>()
    const  [ isMinting, setIsMinting ] = useState(false);

    console.log("paperId:",paperId)
    console.log("paperContract1:",paperContract)

    const changeMadal = () => {
        if(!isConnected && isModal === 0) {
          setIsModal(1)
          console.log(isModal)
        }  else if(!isConnected && isModal === 1) {
          setIsModal(0)
          console.log(isModal)
        } else if(isConnected) {
          setIsModal(2)
        }
      }

    const initContract = async() => {

        if ( !paperManagerContract ) return;


        const txn0 = await paperManagerContract.getPaperItemById(paperId);
        console.log("paperManagerContract.getPaperItemById txn:",txn0);
        console.log("txn1.nftContract:",txn0.nftContract);

        console.log("paperId:",paperId)
        console.log("paperContract2:",paperContract)
        console.log("signer:",signer)
        console.log("signerAddr:",signerAddr)

        const tempPaperContract = await getPaperContractByAddress(txn0.nftContract, web3Provider, signer);
        console.log("tempPaperContract:",tempPaperContract);

        const paperContractContent = await paperManagerContract.getPaperItemById(paperId)

        console.log("title:",paperContractContent.title);
        console.log("ownerName:",paperContractContent.ownerName);

        setPaperTitle(paperContractContent.title);
        setPaperOwnerName(paperContractContent.ownerName);
        
    }

    useEffect(() => {
        initContract();
        changeMadal();
        changeSvg("Input your comment here")
    } , [isConnected])

    const splitLines = (message: string)=> {
        const drawx = 20;
        const drawy = 20;
        const fontSize = 64;
        const lineHeight = 1.25;
        const svgTexts=message.split('\n').map(function(a : string,i : number){
            return '<tspan x="'+drawx+'" y="'+(drawy+fontSize*lineHeight+i*fontSize*lineHeight)+'">'+a+'</tspan>' }
            ).join('\n');
        console.log("splitLines.tspans:",svgTexts);
        return svgTexts;
    }

    const handleSubmit = async (event : any ) => {
        // Stop the form from submitting and refreshing the page.
        event.preventDefault()

        if ( !paperManagerContract ) return;

        // ?????? ???????????? ?????? 
        setIsMinting(true);

        const txn0 = await paperManagerContract.getPaperItemById(paperId);
        console.log("paperManagerContract.getPaperItemById txn:",txn0);
        console.log("txn1.nftContract:",txn0.nftContract);

        console.log("paperId:",paperId)
        console.log("paperContract2:",paperContract)
        console.log("signer:",signer)
        console.log("signerAddr:",signerAddr)

        const tempPaperContract = await getPaperContractByAddress(txn0.nftContract, web3Provider, signer);
        console.log("tempPaperContract:",tempPaperContract);

        const data = {
            name: event.target.name.value,
            message: event.target.message.value,
        }

        if ( !paperContract ) 
        {
            setIsMinting(false);
            return;
        }

        console.log("paperContract3:", paperContract)
        //const txn1 = await paperContract.getAllTokenURI();
        //console.log("getAllTokenURI:",txn1);

        // todo assets folder ?????? ???????????? ??????.
        // todo ?????? ???????????? ???????????? svg ??? ???????????? ??????.

        const payload = props.svgFilePayload;//svgSample1;

    // https://stackoverflow.com/questions/31469134/how-to-display-multiple-lines-of-text-in-svg

        const svgTexts = splitLines(data.message);

      const re1 = /REPLACE/gi; 
      const newstr = payload.replace(re1, svgTexts); 

      console.log("newstr:",newstr);

      // https://javascript.info/blob
      const imgBlob = new Blob([newstr], { type: "image/svg+xml" });

      const client = new NFTStorage({ token: NFTStorageAPIKey });
      const metadata = await client.store({
          name: data.name,
          description: data.message,
          image: imgBlob,
      });

      console.log("Metadata stored on Filecoin and IPFS with URL:", metadata.url)

      // TODO prepare error 
      const mintTxn = await tempPaperContract.mintTokenTo(signerAddr,metadata.url);
      console.log("mintTxn:", mintTxn);
      setTransactionHash(mintTxn.hash)
      setNftAddres(tempPaperContract.address)

      //  ?????????????????
      await mintTxn.wait();

      // TODO ???  ????????? count??? ??????????????? ??????????????? ?????? 
      const totalItems = await tempPaperContract.returnTotalItems()
      setTotalNftItems(totalItems.toNumber());

      //https://testnets.opensea.io/assets/mumbai/0x3e489916bfde0db4380358bdbe2575136c3c42dd/1
      //tempPaperContract.address

      //    ?????? ??????  
      // TODO  ?????????  error ?????? false ?????????  ???.
        setIsMinting(false);

    }
 
    const changeSvg = (messageText : string) => {

        const payload = props.svgFilePayload; 

        const svgTexts = splitLines(messageText);

        const re = /REPLACE/gi; 
        const svg = payload.replace(re, svgTexts);

        const blob = new Blob([svg], {type: 'image/svg+xml'});
        // https://medium.com/@benjamin.black/using-blob-from-svg-text-as-image-source-2a8947af7a8e
        const url = URL.createObjectURL(blob);
        setSvgBlobUrl(url);
    }

    const showComment = (event : any) => {
        changeSvg(event.target.value);
        console.log(event.target.value)
        //setComment(event.target.value)
    }

    return (
        <main className='mt-44 relative'>
            <div className='w-4/5 mx-auto'>
                <div className='text-3xl font-semibold'>
                    {paperTitle}
                </div>
                {/* <div className='mt-12 text-xl font-semibold'>
                    ????????? ?????????????????? 
                </div> */}
                <div className='mt-4 text-sm text-[#6C727A] font-semibold'>
                    {paperOwnerName}????????? ????????? ????????? ???????????? ??????????????? ??????????????????.
                </div>
                <section className='w-full flex justify-center'>
                    <div className='mt-16 w-1/3 text-center drop-shadow-lg'>
                        <img 
                            src={svgBlobUrl} 
                            alt="svg" 
                            />
                    </div>
                </section>
                <form onSubmit={handleSubmit}>
                    <div className='w-4/5 mx-auto mt-8'>
                        <label htmlFor="name" className='block text-xl font-medium'>??????</label>
                        <input id='name' type="text" className='mt-2 w-full border-[#D1D6DB] rounded-md' placeholder={`${paperOwnerName}?????? ???????????? ????????? ??????(?????? 32???)`} maxLength={32} required />
                    </div>
                    <div className='w-4/5 mx-auto mt-8'>
                        <label htmlFor="message" className='block text-xl font-medium'>?????????</label>
                        <textarea onChange={showComment} id="message" placeholder={`${paperOwnerName}????????? ????????? ?????????`} className='mt-2 w-full h-32 border-[#D1D6DB] rounded-md resize-none' maxLength={128} required />
                    </div> 
                    <div className='mt-8 mb-40 flex justify-center'>
                        <Link href="/paper/list">
                                <a className='w-1/6 py-3 text-center mx-1 rounded-xl bg-[#CDD1F2] text-[#5760BC] font-semibold border-2 border-[#CDD1F2] hover:border-[#CDD1F2] hover:bg-[#fff]'>
                                    ??????
                                </a>
                        </Link>
                        { !isMinting && (
                            <button type="submit" className='w-1/6 py-3 mx-1 border-2 rounded-xl bg-[#5760BC] text-[#fff] font-medium hover:border-[#5760BC] hover:bg-[#fff] hover:text-[#5760BC] hover:font-semibold'>????????? ?????? ??????</button>
                        )}
                    </div>
                </form>
            </div>
            <Footer />
            {isModal === 1 
                ? <ConnectModal 
                    isConnected={isConnected}
                    connectWallet={connectWallet}
                    isModal={isModal}
                    changeModal={changeMadal}
                />
          : null}
          {isConnected 
          && nftAddress !== 'DEFAULT ADDRESS' 
          && transactionHash !== 'DEFAULT HASH' 
          && (
            <MintingModal 
                paperOwnerName={paperOwnerName}
                nftAddress={nftAddress}
                totalNftItems={totalNftItems}
                transactionHash={transactionHash}
            />
          )}
        </main>
    )
  
}

const fontFiles = [
    "./assets/tokenURI/Group 207.svg",
    "./assets/tokenURI/Group 208.svg",
    "./assets/tokenURI/Group 209.svg",
    "./assets/tokenURI/Group 210.svg",
    "./assets/tokenURI/Group 211.svg",
    "./assets/tokenURI/Group 212.svg",
    "./assets/tokenURI/Group 213.svg",
    "./assets/tokenURI/Group 214.svg",
    "./assets/tokenURI/Group 215.svg",
    "./assets/tokenURI/Group 216.svg",
]

export async function getStaticProps() {
    try {
        
        // const fileText1 = fs.readFileSync(
        //     `./assets/tokenURI/Group 207.svg`,
        //     `utf8`
        // )
        //console.log("fileText1:",fileText1);
        const x = Math.floor(Math.random() * fontFiles.length)
        //for (let x in fontFiles) {
        //    console.log("x:",x);
        const fileText1= fs.readFileSync(fontFiles[x],`utf8`)   
        //}

        return {
            props: {
                svgFilePayload : fileText1,
            },
        }

    } catch (err) {
    console.log(err)
    return {
        props: {
            svgFilePayload: `<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 500 500">
            <style>.b { fill: white; font-family: serif; font-size: 14px; }</style>
            <rect width="100%" height="100%" fill="black" />
            <text x="50%" y="50%" class="b">REPLACE</text>
          </svg>`,
            },
        }
     }

}


// export async function getStaticProps() {
//     try {
        
//         const fileText1 = fs.readFileSync(
//             `./assets/tokenURI/Group 207.svg`,
//             `utf8`
//         )
//         //console.log("fileText1:",fileText1);
//         return {
//             props: {
//                 svgSample1: fileText1,
//             },
//         }
//     } catch (err) {
//     console.log(err)
//     return {
//         props: {
//             svgSample1: `<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 500 500">
//             <style>.b { fill: white; font-family: serif; font-size: 14px; }</style>
//             <rect width="100%" height="100%" fill="black" />
//             <text x="50%" y="50%" class="b">REPLACE</text>
//           </svg>`,
//             },
//         }
//      }

// }



export default NewComment
