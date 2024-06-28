import { useEffect, useState } from 'react'
import {
  reactExtension,
  useApi,
  Grid,
  BlockStack,
  TextBlock,
  Button,
  Image,
  Page,
  ResourceItem,
  SkeletonImage,
  SkeletonText,
} from "@shopify/ui-extensions-react/customer-account";

export default reactExtension(
  "customer-account.page.render",
  () => <FullPageExtension />
);
interface DraftOrder {
  node: {
    id: string;
    name: string;
    line_items: { title: string; quantity: number }[];
    customer: { first_name: string; last_name: string };
    shipping_address: { address1: string };
    total_price: string;
    currency: string;
    payment_terms: string | null;
  }
}

function FullPageExtension() {
  const { i18n, query } = useApi<"customer-account.page.render">();
  const [approvals, setApprovals] = useState<DraftOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [removeLoading, setRemoveLoading] = useState({ id: null, loading: false })

  async function fetchApprovals() {
    setLoading(true);
    try {
      // Implement a server request to retrieve the approvals for this customer
      // Then call the Storefront API to retrieve the details of the approvalsed products
      const data = await query<{ metaobjects: { edges: DraftOrder[] } }>(
        ` {
        draftOrders(first: 10, query: "metafield:'draftorder.requiresapproval:true'") {
            edges {
              node {
                id
                name
                totalPrice
                customer {
                  firstName
                  lastName
                }
                metafields(first: 5) {
                  edges {
                    node {
                      namespace
                      key
                      value
                    }
                  }
                }
                lineItems(first: 5) {
                  edges {
                    node {
                      title
                      quantity
                      price
                    }
                  }
                }
              }
            }
          }
        }`,
        
      );
      let incomingApprovals = data.data.metaobjects.edges
      setApprovals(incomingApprovals)
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error)
    }
  }

  async function deleteApprovalsItem(id: string) {
    // Simulate a server request
    setRemoveLoading({ loading: true, id });
    return new Promise<void>((resolve) => {
      setTimeout(() => {

        // Send a request to your server to delete the approvals item
        setApprovals(approvals.filter((item) => item.node.id !== id))

        setRemoveLoading({ loading: false, id: null });
        resolve();
      }, 750)
    });
  }

  useEffect(() => {
    fetchApprovals();
  }, [])

  return (
    <Page title="Approval Queue">
      <Grid columns={['fill', 'fill', 'fill']} rows="auto" spacing="loose">
        {loading && <ResourceItem loading>
          <BlockStack spacing="base">
            <SkeletonImage inlineSize="fill" aspectRatio={1} blockSize="fill" />
            <BlockStack spacing="none">
              <SkeletonText inlineSize="base" />
            </BlockStack>
            <SkeletonText inlineSize="small" />
          </BlockStack>
        </ResourceItem>}
        {!loading && approvals.length > 0 && approvals.map((approval) => {
          let orderDetails = JSON.parse(approval.node.order_details.value).draft_order
          return (
            <ResourceItem loading={loading} key={approval.node.id} action={
              <>
                <Button
                  kind='primary'
                  loading={removeLoading.loading && approval.node.id === removeLoading.id}
                  onPress={() => {
                    deleteApprovalsItem(approval.node.id)
                  }}
                >
                  Approve Order
                </Button>
                <Button
                  kind='secondary'
                  loading={removeLoading.loading && approval.node.id === removeLoading.id}
                  onPress={() => {
                    deleteApprovalsItem(approval.node.id)
                  }}
                >
                  Remove
                </Button>
              </>
            }>
              <BlockStack spacing="base">
                <TextBlock>{approval.node.identifier.value}</TextBlock>
                <TextBlock>{approval.node.approval_status.value}</TextBlock>
              </BlockStack>
              <BlockStack spacing="base">
              <TextBlock>{orderDetails.line_items.length} items</TextBlock>
              <TextBlock>{orderDetails.name}</TextBlock>
              </BlockStack>
              <BlockStack spacing="base">
              <TextBlock>{orderDetails.customer.first_name + " " + orderDetails.customer.last_name}</TextBlock>
              <TextBlock>{orderDetails.shipping_address.address1}</TextBlock>
              </BlockStack>
              <BlockStack spacing="base">
              <TextBlock>${orderDetails.total_price + " " + orderDetails.currency}</TextBlock>
              <TextBlock>{orderDetails.payment_terms ? orderDetails.payment_terms : "Payment Due"}</TextBlock>
              </BlockStack>
            </ResourceItem>
          )
        })
        }
        {!loading && approvals.length === 0 && <TextBlock>No orders in your approvals queue.</TextBlock>}
      </Grid>
    </Page>
  );
}
