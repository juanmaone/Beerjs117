import {chromium} from 'playwright';
export async function browser(){
 return chromium.launch({headless:true,...(process.platform==='win32'?{channel:'chrome'}:{})});
}
