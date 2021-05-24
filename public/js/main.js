
const paragraphs = document.querySelectorAll('.blog-post-body p');
const readTimeDiv = document.querySelector('.read-time');


//Calculate read time

const calculateReadTime = () => {
  let numberOfWords = 0;
  const averageWPM = 100;
  paragraphs.forEach(paragraph=>{
      numberOfWords += paragraph.innerHTML.split(" ").length;
  });
  let readTime = numberOfWords / averageWPM;
 console.log('readtime:' + Math.round(readTime))
  console.log('Number of words:'+ numberOfWords)

  readTimeDiv.innerHTML = Math.round(readTime) + " minute read ";
};
calculateReadTime();

//read time end


